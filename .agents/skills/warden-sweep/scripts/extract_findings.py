#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# ///
"""
Extract individual findings from warden JSONL log files.

Usage:
    python extract_findings.py <log-path-or-directory> -o <output.jsonl>
    python extract_findings.py .warden/logs/ --scan-index data/scan-index.jsonl -o findings.jsonl

Reads warden JSONL logs (one skill record per line, summary as last line),
extracts each finding as a standalone record with a stable ID, and writes
one finding per line to the output file.

Finding ID format: <skill>-<sha256(title+path+line)[:8]>
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any


def generate_finding_id(skill: str, title: str, path: str, line: int | None) -> str:
    """Generate a stable, deterministic finding ID."""
    raw = f"{title}:{path}:{line or 0}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:8]
    # Sanitize skill name for use in ID
    safe_skill = skill.replace("/", "-").replace(" ", "-").lower()
    return f"{safe_skill}-{digest}"


def parse_jsonl_log(log_path: str) -> list[dict[str, Any]]:
    """Parse a warden JSONL log file and extract individual findings.

    Each non-summary line has the shape:
    {
      "run": {...},
      "skill": "...",
      "findings": [{...}, ...],
      ...
    }

    The last line is a summary record with "type": "summary" which we skip.
    """
    findings = []
    try:
        with open(log_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Skip summary records
                if record.get("type") == "summary":
                    continue

                skill = record.get("skill", "unknown")
                run_meta = record.get("run", {})
                record_findings = record.get("findings", [])

                for finding in record_findings:
                    location = finding.get("location", {})
                    file_path = location.get("path", "")
                    start_line = location.get("startLine")
                    end_line = location.get("endLine")

                    finding_id = generate_finding_id(
                        skill=skill,
                        title=finding.get("title", ""),
                        path=file_path,
                        line=start_line,
                    )

                    normalized = {
                        "findingId": finding_id,
                        "file": file_path,
                        "skill": skill,
                        "severity": finding.get("severity", "info"),
                        "confidence": finding.get("confidence"),
                        "title": finding.get("title", ""),
                        "description": finding.get("description", ""),
                        "verification": finding.get("verification"),
                        "location": {
                            "path": file_path,
                            "startLine": start_line,
                            "endLine": end_line,
                        },
                        "suggestedFix": finding.get("suggestedFix"),
                        "logPath": log_path,
                        "runId": run_meta.get("runId", ""),
                    }

                    findings.append(normalized)

    except (OSError, IOError) as e:
        print(f"Error reading {log_path}: {e}", file=sys.stderr)

    return findings


def collect_log_paths(source: str, scan_index: str | None = None) -> list[str]:
    """Collect log file paths from a directory or scan index."""
    paths: list[str] = []

    if scan_index and os.path.exists(scan_index):
        # Read log paths from scan-index.jsonl
        seen = set()
        total_entries = 0
        missing = 0
        with open(scan_index) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if entry.get("status") != "complete":
                    continue
                total_entries += 1
                log_path = entry.get("logPath", "")
                if log_path and log_path not in seen:
                    seen.add(log_path)
                    if os.path.isfile(log_path):
                        paths.append(log_path)
                    else:
                        missing += 1
        if missing > 0:
            print(
                f"Warning: {missing} log path(s) from scan-index not found on disk",
                file=sys.stderr,
            )
        # Only use scan-index results if we actually found logs;
        # fall through to source directory otherwise
        if paths:
            return paths
        if total_entries > 0:
            print(
                "Warning: scan-index had entries but no valid log paths; "
                "falling back to source directory",
                file=sys.stderr,
            )

    source_path = Path(source)
    if source_path.is_file():
        return [str(source_path)]

    if source_path.is_dir():
        for f in sorted(source_path.glob("*.jsonl")):
            paths.append(str(f))
        return paths

    print(f"Source not found: {source}", file=sys.stderr)
    return paths


def main():
    parser = argparse.ArgumentParser(
        description="Extract findings from warden JSONL logs"
    )
    parser.add_argument(
        "source",
        help="Path to a JSONL log file or directory of log files",
    )
    parser.add_argument(
        "-o", "--output",
        required=True,
        help="Output path for normalized findings JSONL",
    )
    parser.add_argument(
        "--scan-index",
        help="Path to scan-index.jsonl (uses log paths from completed scans)",
    )
    args = parser.parse_args()

    log_paths = collect_log_paths(args.source, args.scan_index)
    if not log_paths:
        print("No log files found.", file=sys.stderr)
        sys.exit(1)

    all_findings: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for log_path in log_paths:
        findings = parse_jsonl_log(log_path)
        for f in findings:
            fid = f["findingId"]
            if fid not in seen_ids:
                seen_ids.add(fid)
                all_findings.append(f)

    # Write output
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w") as out:
        for finding in all_findings:
            out.write(json.dumps(finding) + "\n")

    print(
        json.dumps({
            "logsProcessed": len(log_paths),
            "findingsExtracted": len(all_findings),
            "outputPath": args.output,
        })
    )


if __name__ == "__main__":
    main()
