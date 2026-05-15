#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# ///
"""
Warden Sweep: Index existing PRs for deduplication.

Fetches open warden-labeled PRs via gh, identifies file overlap with
verified findings, and caches diffs for overlapping PRs.

Usage:
    uv run index_prs.py <sweep-dir>

Stdout: JSON summary (for LLM consumption)
Stderr: Progress lines

Side effects:
    - Creates data/existing-prs.json
    - Creates data/pr-diffs/<number>.diff for overlapping PRs
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _utils import read_jsonl, run_cmd  # noqa: E402


def fetch_warden_prs(sweep_dir: str) -> list[dict[str, Any]]:
    """Fetch open PRs with the warden label."""
    result = run_cmd(
        [
            "gh", "pr", "list",
            "--label", "warden",
            "--state", "open",
            "--json", "number,title,url,files",
            "--limit", "100",
        ],
        timeout=30,
    )

    if result.returncode != 0:
        print(f"Warning: gh pr list failed: {result.stderr}", file=sys.stderr)
        return []

    try:
        prs = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Warning: Failed to parse gh pr list output", file=sys.stderr)
        return []

    # Save raw PR data
    prs_path = os.path.join(sweep_dir, "data", "existing-prs.json")
    with open(prs_path, "w") as f:
        json.dump(prs, f, indent=2)
        f.write("\n")

    return prs


def build_file_index(
    prs: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    """Build a file-to-PR lookup from the PR list."""
    index: dict[str, list[dict[str, Any]]] = {}

    for pr in prs:
        pr_info = {
            "number": pr.get("number"),
            "title": pr.get("title", ""),
            "url": pr.get("url", ""),
        }
        files = pr.get("files") or []
        for file_entry in files:
            # gh returns files as objects with "path" key
            if isinstance(file_entry, dict):
                path = file_entry.get("path", "")
            else:
                path = str(file_entry)
            if path:
                index.setdefault(path, []).append(pr_info)

    return index


def get_verified_files(sweep_dir: str) -> set[str]:
    """Get the set of files that have verified findings."""
    verified_path = os.path.join(sweep_dir, "data", "verified.jsonl")
    entries = read_jsonl(verified_path)
    return {e.get("file", "") for e in entries if e.get("file")}


def fetch_pr_diff(pr_number: int, sweep_dir: str) -> bool:
    """Fetch and cache a PR diff. Returns True on success."""
    diff_path = os.path.join(
        sweep_dir, "data", "pr-diffs", f"{pr_number}.diff"
    )

    # Skip if already cached
    if os.path.exists(diff_path):
        return True

    result = run_cmd(
        ["gh", "pr", "diff", str(pr_number)],
        timeout=30,
    )

    if result.returncode != 0:
        print(
            f"Warning: Failed to fetch diff for PR #{pr_number}: {result.stderr}",
            file=sys.stderr,
        )
        return False

    with open(diff_path, "w") as f:
        f.write(result.stdout)

    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Warden Sweep: Index existing PRs for dedup"
    )
    parser.add_argument("sweep_dir", help="Path to the sweep directory")
    args = parser.parse_args()

    sweep_dir = args.sweep_dir

    if not os.path.isdir(sweep_dir):
        print(
            json.dumps({"error": f"Sweep directory not found: {sweep_dir}"}),
            file=sys.stdout,
        )
        sys.exit(1)

    # Ensure pr-diffs directory exists
    os.makedirs(os.path.join(sweep_dir, "data", "pr-diffs"), exist_ok=True)

    # Fetch open warden PRs
    print("Fetching open warden-labeled PRs...", file=sys.stderr)
    prs = fetch_warden_prs(sweep_dir)
    print(f"Found {len(prs)} open warden PR(s)", file=sys.stderr)

    # Build file index
    file_index = build_file_index(prs)

    # Find overlap with verified findings
    verified_files = get_verified_files(sweep_dir)
    overlapping_prs: set[int] = set()

    for vfile in verified_files:
        if vfile in file_index:
            for pr_info in file_index[vfile]:
                overlapping_prs.add(pr_info["number"])

    # Fetch diffs for overlapping PRs
    diffs_cached = 0
    for pr_number in sorted(overlapping_prs):
        print(f"Caching diff for PR #{pr_number}...", file=sys.stderr)
        if fetch_pr_diff(pr_number, sweep_dir):
            diffs_cached += 1

    # Build output file index (only for files that have verified findings)
    output_file_index: dict[str, list[dict[str, Any]]] = {}
    for vfile in verified_files:
        if vfile in file_index:
            output_file_index[vfile] = file_index[vfile]

    # Output summary
    output = {
        "totalPRs": len(prs),
        "overlappingPRs": len(overlapping_prs),
        "fileIndex": output_file_index,
        "diffsCached": diffs_cached,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
