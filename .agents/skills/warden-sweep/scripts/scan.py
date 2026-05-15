#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = ["tomli; python_version < '3.11'"]
# ///
"""
Warden Sweep: Scan phase.

Replaces Phase 0 (setup) and Phase 1 (scan) with a single script.
Generates a run ID, creates the sweep directory, checks dependencies,
creates the warden label, enumerates files, runs warden on each file,
writes scan-index.jsonl, and calls extract_findings.py.

Usage:
    uv run scan.py [file ...]
    uv run scan.py --sweep-dir .warden/sweeps/abc123
    uv run scan.py src/foo.ts src/bar.ts

Stdout: JSON summary (for LLM consumption)
Stderr: Progress lines as files complete
Exit codes: 0 = success, 1 = fatal, 2 = partial (some files errored)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib  # type: ignore[no-redefine]

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _utils import ensure_github_label, run_cmd  # noqa: E402


SUPPORTED_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java",
    ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".cs", ".swift",
    ".kt", ".scala", ".sh", ".bash", ".zsh",
}


def generate_run_id() -> str:
    """Generate a short random run ID."""
    return secrets.token_hex(4)


def check_dependencies() -> list[str]:
    """Check that required commands are available. Return list of missing."""
    import shutil
    return [cmd for cmd in ["warden", "gh", "git"] if shutil.which(cmd) is None]


def create_sweep_dir(sweep_dir: str) -> None:
    """Create the sweep directory structure."""
    for subdir in [
        "findings",
        "security",
        "data/verify",
        "data/logs",
        "data/pr-diffs",
    ]:
        os.makedirs(os.path.join(sweep_dir, subdir), exist_ok=True)


def write_manifest(sweep_dir: str, run_id: str) -> None:
    """Write the initial manifest.json."""
    repo = "unknown"
    try:
        result = run_cmd(["git", "remote", "get-url", "origin"])
        if result.returncode == 0 and result.stdout.strip():
            repo = result.stdout.strip()
        else:
            repo = os.path.basename(os.getcwd())
    except Exception:
        repo = os.path.basename(os.getcwd())

    manifest = {
        "runId": run_id,
        "startedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "repo": repo,
        "phases": {
            "scan": "pending",
            "verify": "pending",
            "issue": "pending",
            "patch": "pending",
            "organize": "pending",
        },
    }

    manifest_path = os.path.join(sweep_dir, "data", "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")


def load_ignore_paths() -> list[str]:
    """Load ignorePaths from warden.toml defaults if present."""
    toml_path = "warden.toml"
    if not os.path.exists(toml_path):
        return []
    try:
        with open(toml_path, "rb") as f:
            config = tomllib.load(f)
        paths = config.get("defaults", {}).get("ignorePaths", [])
        return paths if isinstance(paths, list) else []
    except Exception:
        return []


def should_ignore(path: str, ignore_patterns: list[str]) -> bool:
    """Check if a path matches any ignore pattern (simple glob matching)."""
    if not ignore_patterns:
        return False

    from fnmatch import fnmatch

    for pattern in ignore_patterns:
        if fnmatch(path, pattern):
            return True
        # Handle ** patterns
        if "**" in pattern:
            # Convert ** glob to work with fnmatch
            simple = pattern.replace("**/", "*/")
            if fnmatch(path, simple):
                return True
            # Also try zero-directory match (** matches zero directories)
            collapsed = pattern.replace("**/", "")
            if fnmatch(path, collapsed):
                return True
            # Also try matching any subdirectory
            parts = path.split("/")
            glob_parts = pattern.split("/")
            if glob_parts[0] == "**":
                # Match from any point
                rest = "/".join(glob_parts[1:])
                for i in range(len(parts)):
                    if fnmatch("/".join(parts[i:]), rest):
                        return True
            elif glob_parts[-1].startswith("*"):
                # e.g., dist/** matches dist/anything, src/**/*.py matches src/x/y.py
                prefix = pattern.split("**")[0].rstrip("/")
                if path.startswith(prefix + "/") or path == prefix:
                    suffix = pattern.split("**")[-1]
                    if not suffix or suffix == "/":
                        # Pure prefix pattern like dist/** - any subpath matches
                        return True
                    # Has suffix like **/*.py - check with fnmatch on the remaining path
                    remaining = path[len(prefix) :].lstrip("/")
                    suffix_pattern = suffix.lstrip("/")
                    if fnmatch(remaining, suffix_pattern) or fnmatch(
                        remaining.split("/")[-1], suffix_pattern
                    ):
                        return True
    return False


def enumerate_files(
    specific_files: list[str] | None, ignore_patterns: list[str]
) -> list[str]:
    """Enumerate files to scan using git ls-files, filtered by extension."""
    if specific_files:
        return [f for f in specific_files if not should_ignore(f, ignore_patterns)]

    result = run_cmd(["git", "ls-files"])
    if result.returncode != 0:
        print(f"git ls-files failed: {result.stderr}", file=sys.stderr)
        return []

    files = []
    for line in result.stdout.splitlines():
        path = line.strip()
        if not path:
            continue

        # Filter by extension
        ext = os.path.splitext(path)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            continue

        # Filter by ignore patterns
        if should_ignore(path, ignore_patterns):
            continue

        files.append(path)

    return files


def load_completed_files(sweep_dir: str) -> set[str]:
    """Load already-completed files from scan-index.jsonl for incrementality."""
    index_path = os.path.join(sweep_dir, "data", "scan-index.jsonl")
    completed: set[str] = set()
    if not os.path.exists(index_path):
        return completed

    with open(index_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if entry.get("status") == "complete":
                    completed.add(entry.get("file", ""))
            except json.JSONDecodeError:
                continue
    return completed


def log_path_for_file(sweep_dir: str, file_path: str) -> str:
    """Generate a deterministic log path for a file."""
    digest = hashlib.sha256(file_path.encode()).hexdigest()[:16]
    return os.path.join(sweep_dir, "data", "logs", f"{digest}.jsonl")


def scan_file(
    file_path: str, log_file: str, timeout: int = 600, skill: str | None = None
) -> dict[str, Any]:
    """Run warden on a single file. Returns scan-index entry."""
    try:
        cmd = [
            "warden", file_path,
            "--json", "--log",
            "--min-confidence", "off",
            "--fail-on", "off",
            "--quiet",
            "--output", log_file,
        ]
        if skill:
            cmd.extend(["--skill", skill])
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        # Check for warden failure
        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else "non-zero exit"
            return {
                "file": file_path,
                "status": "error",
                "error": f"warden failed: {error_msg}",
                "exitCode": result.returncode,
            }

        # Check that log file was created
        if not os.path.exists(log_file):
            return {
                "file": file_path,
                "status": "error",
                "error": "log file not created",
                "exitCode": result.returncode,
            }

        # Count findings from the log file
        finding_count = 0
        skills: set[str] = set()
        with open(log_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    if record.get("type") == "summary":
                        continue
                    record_skill = record.get("skill", "")
                    if record_skill:
                        skills.add(record_skill)
                    findings = record.get("findings", [])
                    finding_count += len(findings)
                except json.JSONDecodeError:
                    continue

        return {
            "file": file_path,
            "logPath": log_file,
            "skills": sorted(skills),
            "findingCount": finding_count,
            "status": "complete",
            "exitCode": result.returncode,
        }

    except subprocess.TimeoutExpired:
        return {
            "file": file_path,
            "status": "error",
            "error": "timeout",
            "exitCode": -1,
        }
    except FileNotFoundError:
        return {
            "file": file_path,
            "status": "error",
            "error": "warden not found",
            "exitCode": -1,
        }
    except Exception as e:
        return {
            "file": file_path,
            "status": "error",
            "error": str(e),
            "exitCode": -1,
        }


def run_extract_findings(sweep_dir: str, script_dir: str) -> None:
    """Run extract_findings.py as a subprocess."""
    extract_script = os.path.join(script_dir, "extract_findings.py")
    logs_dir = os.path.join(sweep_dir, "data", "logs")
    scan_index = os.path.join(sweep_dir, "data", "scan-index.jsonl")
    output = os.path.join(sweep_dir, "data", "all-findings.jsonl")

    try:
        result = subprocess.run(
            [
                sys.executable, extract_script,
                logs_dir,
                "--scan-index", scan_index,
                "-o", output,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            print(
                f"Warning: extract_findings.py failed: {result.stderr}",
                file=sys.stderr,
            )
    except Exception as e:
        print(f"Warning: extract_findings.py failed: {e}", file=sys.stderr)


def load_findings_compact(sweep_dir: str) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Load findings from all-findings.jsonl and return compact list + severity counts."""
    findings_path = os.path.join(sweep_dir, "data", "all-findings.jsonl")
    findings: list[dict[str, Any]] = []
    by_severity: dict[str, int] = {}

    if not os.path.exists(findings_path):
        return findings, by_severity

    with open(findings_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                severity = record.get("severity", "info")
                by_severity[severity] = by_severity.get(severity, 0) + 1

                location = record.get("location", {})
                findings.append({
                    "findingId": record.get("findingId", ""),
                    "title": record.get("title", ""),
                    "file": record.get("file", ""),
                    "startLine": location.get("startLine"),
                    "severity": severity,
                    "confidence": record.get("confidence"),
                    "skill": record.get("skill", ""),
                })
            except json.JSONDecodeError:
                continue

    return findings, by_severity


def update_manifest_phase(sweep_dir: str, phase: str, status: str) -> None:
    """Update a phase status in manifest.json."""
    manifest_path = os.path.join(sweep_dir, "data", "manifest.json")
    if not os.path.exists(manifest_path):
        return

    with open(manifest_path) as f:
        manifest = json.load(f)

    manifest.setdefault("phases", {})[phase] = status

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Warden Sweep: Scan phase (setup + scan)"
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="Specific files to scan (default: all tracked files)",
    )
    parser.add_argument(
        "--sweep-dir",
        help="Resume into an existing sweep directory",
    )
    parser.add_argument(
        "--skill",
        help="Run only this skill (passed through to warden --skill)",
    )
    args = parser.parse_args()

    # Check dependencies
    missing = check_dependencies()
    if missing:
        print(
            json.dumps({"error": f"Missing dependencies: {', '.join(missing)}"}),
            file=sys.stdout,
        )
        sys.exit(1)

    # Determine sweep dir and run ID
    if args.sweep_dir:
        sweep_dir = args.sweep_dir
        # Extract run ID from path (normalize to handle trailing slashes)
        run_id = os.path.basename(os.path.normpath(sweep_dir))
    else:
        run_id = generate_run_id()
        sweep_dir = os.path.join(".warden", "sweeps", run_id)

    # Setup
    create_sweep_dir(sweep_dir)

    # Only write manifest if it doesn't exist (for resume support)
    manifest_path = os.path.join(sweep_dir, "data", "manifest.json")
    if not os.path.exists(manifest_path):
        write_manifest(sweep_dir, run_id)

    ensure_github_label("warden", "5319E7", "Automated fix from Warden Sweep")

    # Enumerate files
    ignore_patterns = load_ignore_paths()
    specific_files = args.files if args.files else None
    files = enumerate_files(specific_files, ignore_patterns)

    if not files:
        print(
            json.dumps({
                "error": "No files to scan",
                "runId": run_id,
                "sweepDir": sweep_dir,
            }),
            file=sys.stdout,
        )
        sys.exit(1)

    # Load completed files for incrementality
    completed = load_completed_files(sweep_dir)
    remaining = [f for f in files if f not in completed]

    total = len(files)
    already_done = len(completed & set(files))
    scan_index_path = os.path.join(sweep_dir, "data", "scan-index.jsonl")

    if already_done > 0:
        print(
            f"Resuming: {already_done}/{total} files already scanned",
            file=sys.stderr,
        )

    # Scan remaining files concurrently
    scanned = already_done
    index_lock = threading.Lock()

    def _scan_and_record(file_path: str) -> dict[str, Any]:
        log_file = log_path_for_file(sweep_dir, file_path)
        entry = scan_file(file_path, log_file, skill=args.skill)

        with index_lock:
            with open(scan_index_path, "a") as f:
                f.write(json.dumps(entry) + "\n")

        return entry

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {
            pool.submit(_scan_and_record, fp): fp for fp in remaining
        }
        for future in as_completed(futures):
            entry = future.result()
            scanned += 1
            file_path = entry.get("file", futures[future])
            if entry["status"] == "error":
                label = "TIMEOUT" if entry.get("error") == "timeout" else "ERROR"
                print(
                    f"[{scanned}/{total}] {file_path} ({label}: {entry.get('error', 'unknown')})",
                    file=sys.stderr,
                )
            else:
                count = entry.get("findingCount", 0)
                suffix = f"({count} finding{'s' if count != 1 else ''})" if count > 0 else ""
                print(
                    f"[{scanned}/{total}] {file_path} {suffix}".rstrip(),
                    file=sys.stderr,
                )

    # Extract findings
    script_dir = os.path.dirname(os.path.abspath(__file__))
    run_extract_findings(sweep_dir, script_dir)

    # Load findings for output
    findings, by_severity = load_findings_compact(sweep_dir)

    # Collect errors for output, deduplicating by file (last entry wins)
    # so that resumed scans don't include stale errors for files that later succeeded.
    # Scope to current file list so counts stay consistent with `scanned`.
    files_set = set(files)
    timeouts: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    if os.path.exists(scan_index_path):
        last_status: dict[str, dict[str, Any]] = {}
        with open(scan_index_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    file_path_key = entry.get("file", "")
                    if file_path_key in files_set:
                        last_status[file_path_key] = entry
                except json.JSONDecodeError:
                    continue
        for entry in last_status.values():
            if entry.get("status") == "error":
                item = {
                    "file": entry.get("file", ""),
                    "error": entry.get("error", "unknown"),
                    "exitCode": entry.get("exitCode", -1),
                }
                if entry.get("error") == "timeout":
                    timeouts.append(item)
                else:
                    errors.append(item)

    total_failed = len(timeouts) + len(errors)

    # Output JSON summary
    output = {
        "runId": run_id,
        "sweepDir": sweep_dir,
        "filesScanned": scanned - total_failed,
        "filesTimedOut": len(timeouts),
        "filesErrored": len(errors),
        "totalFindings": len(findings),
        "bySeverity": by_severity,
        "findingsPath": os.path.join(sweep_dir, "data", "all-findings.jsonl"),
        "findings": findings,
        "timeouts": timeouts,
        "errors": errors,
    }

    print(json.dumps(output, indent=2))

    # Fatal only if every file across all runs errored (no successful scans at all)
    successful = scanned - total_failed
    if successful == 0 and scanned > 0:
        update_manifest_phase(sweep_dir, "scan", "error")
        sys.exit(1)

    update_manifest_phase(sweep_dir, "scan", "complete")

    if total_failed > 0:
        sys.exit(2)


if __name__ == "__main__":
    main()
