#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# ///
"""
Generate summary.md and report.json from a completed sweep.

Usage:
    python generate_report.py <sweep-dir>

Reads the data/ subdirectory for all-findings.jsonl, verified.jsonl,
rejected.jsonl, patches.jsonl, and security/index.jsonl, then produces:
  - <sweep-dir>/summary.md
  - <sweep-dir>/data/report.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _utils import read_json, read_jsonl, severity_badge  # noqa: E402


def generate_summary_md(
    manifest: dict[str, Any],
    scan_index: list[dict[str, Any]],
    all_findings: list[dict[str, Any]],
    verified: list[dict[str, Any]],
    rejected: list[dict[str, Any]],
    patches: list[dict[str, Any]],
    security_index: list[dict[str, Any]],
) -> str:
    """Generate the summary.md content."""
    run_id = manifest.get("runId", "unknown")
    started_at = manifest.get("startedAt", "unknown")
    repo = manifest.get("repo", "unknown")
    completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    files_scanned = sum(1 for e in scan_index if e.get("status") == "complete")
    files_timed_out = sum(
        1 for e in scan_index
        if e.get("status") == "error" and e.get("error") == "timeout"
    )
    files_errored = sum(
        1 for e in scan_index
        if e.get("status") == "error" and e.get("error") != "timeout"
    )

    prs_created = sum(1 for p in patches if p.get("status") == "created")
    prs_failed = sum(1 for p in patches if p.get("status") == "error")

    # Severity breakdown of verified findings
    by_severity: dict[str, int] = {}
    for f in verified:
        sev = f.get("severity", "info")
        by_severity[sev] = by_severity.get(sev, 0) + 1

    lines = [
        f"# Warden Sweep: `{run_id}`",
        "",
        f"**Repo**: {repo}",
        f"**Started**: {started_at}",
        f"**Completed**: {completed_at}",
        "",
        "## Stats",
        "",
        f"| Metric | Count |",
        f"|--------|-------|",
        f"| Files scanned | {files_scanned} |",
        f"| Files timed out | {files_timed_out} |",
        f"| Files errored | {files_errored} |",
        f"| Total findings | {len(all_findings)} |",
        f"| Verified | {len(verified)} |",
        f"| Rejected | {len(rejected)} |",
        f"| PRs created | {prs_created} |",
        f"| PRs failed | {prs_failed} |",
        f"| Security findings | {len(security_index)} |",
        "",
    ]

    if by_severity:
        lines.append("### By Severity")
        lines.append("")
        for sev in ["critical", "high", "medium", "low", "info"]:
            count = by_severity.get(sev, 0)
            if count > 0:
                lines.append(f"- {severity_badge(sev)}: {count}")
        lines.append("")

    # Security callout
    if security_index:
        lines.append("## Security Findings")
        lines.append("")
        lines.append("The following findings are security-related and may need priority review:")
        lines.append("")
        lines.append("| ID | Severity | Skill | File | Title |")
        lines.append("|----|----------|-------|------|-------|")
        for sf in security_index:
            fid = sf.get("findingId", "")
            sev = severity_badge(sf.get("severity", "info"))
            skill = sf.get("skill", "")
            filepath = sf.get("file", "")
            title = sf.get("title", "")
            lines.append(f"| `{fid}` | {sev} | {skill} | `{filepath}` | {title} |")
        lines.append("")

    # Verified findings table
    if verified:
        lines.append("## Verified Findings")
        lines.append("")
        lines.append("| ID | Severity | Skill | File | Title | PR |")
        lines.append("|----|----------|-------|------|-------|-----|")

        # Build patches lookup
        pr_lookup: dict[str, str] = {}
        for p in patches:
            if p.get("status") == "created" and p.get("findingId"):
                pr_lookup[p["findingId"]] = p.get("prUrl", "")

        for f in verified:
            fid = f.get("findingId", "")
            sev = severity_badge(f.get("severity", "info"))
            skill = f.get("skill", "")
            filepath = f.get("file", "")
            title = f.get("title", "")
            pr_url = pr_lookup.get(fid, "")
            pr_link = f"[PR]({pr_url})" if pr_url else "-"
            lines.append(f"| `{fid}` | {sev} | {skill} | `{filepath}` | {title} | {pr_link} |")
        lines.append("")

    # Rejected findings summary
    if rejected:
        lines.append(f"## Rejected Findings ({len(rejected)})")
        lines.append("")
        lines.append("These findings were evaluated and determined to be false positives.")
        lines.append("See `data/rejected.jsonl` for details.")
        lines.append("")

    lines.append("---")
    lines.append(f"*Generated by Warden Sweep `{run_id}`*")

    return "\n".join(lines) + "\n"


def generate_report_json(
    manifest: dict[str, Any],
    scan_index: list[dict[str, Any]],
    all_findings: list[dict[str, Any]],
    verified: list[dict[str, Any]],
    rejected: list[dict[str, Any]],
    patches: list[dict[str, Any]],
    security_index: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate the report.json data."""
    run_id = manifest.get("runId", "unknown")
    completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    files_scanned = sum(1 for e in scan_index if e.get("status") == "complete")
    files_timed_out = sum(
        1 for e in scan_index
        if e.get("status") == "error" and e.get("error") == "timeout"
    )
    files_errored = sum(
        1 for e in scan_index
        if e.get("status") == "error" and e.get("error") != "timeout"
    )
    prs_created = sum(1 for p in patches if p.get("status") == "created")
    prs_failed = sum(1 for p in patches if p.get("status") == "error")

    # Count verify errors (findings in all but not in verified or rejected)
    verified_ids = {f["findingId"] for f in verified if "findingId" in f}
    rejected_ids = {f["findingId"] for f in rejected if "findingId" in f}
    all_ids = {f["findingId"] for f in all_findings if "findingId" in f}
    verify_errors = len(all_ids - verified_ids - rejected_ids)

    return {
        "runId": run_id,
        "completedAt": completed_at,
        "scan": {
            "filesScanned": files_scanned,
            "filesTimedOut": files_timed_out,
            "filesErrored": files_errored,
            "totalFindings": len(all_findings),
        },
        "verify": {
            "verified": len(verified),
            "rejected": len(rejected),
            "errors": verify_errors,
        },
        "patch": {
            "prsCreated": prs_created,
            "prsFailed": prs_failed,
        },
        "security": {
            "count": len(security_index),
        },
        "prs": [
            {
                "findingId": p.get("findingId", ""),
                "url": p.get("prUrl", ""),
                "severity": next(
                    (f.get("severity", "") for f in verified if f.get("findingId") == p.get("findingId")),
                    "",
                ),
            }
            for p in patches
            if p.get("status") == "created"
        ],
    }


def main():
    parser = argparse.ArgumentParser(
        description="Generate sweep summary and report"
    )
    parser.add_argument("sweep_dir", help="Path to the sweep output directory")
    args = parser.parse_args()

    sweep_dir = args.sweep_dir
    data_dir = os.path.join(sweep_dir, "data")

    # Read inputs
    manifest = read_json(os.path.join(data_dir, "manifest.json")) or {}
    scan_index = read_jsonl(os.path.join(data_dir, "scan-index.jsonl"))
    all_findings = read_jsonl(os.path.join(data_dir, "all-findings.jsonl"))
    verified = read_jsonl(os.path.join(data_dir, "verified.jsonl"))
    rejected = read_jsonl(os.path.join(data_dir, "rejected.jsonl"))
    patches = read_jsonl(os.path.join(data_dir, "patches.jsonl"))
    security_index = read_jsonl(os.path.join(sweep_dir, "security", "index.jsonl"))

    # Generate summary.md
    summary_md = generate_summary_md(
        manifest, scan_index,
        all_findings, verified, rejected, patches, security_index,
    )
    summary_path = os.path.join(sweep_dir, "summary.md")
    with open(summary_path, "w") as f:
        f.write(summary_md)

    # Generate report.json
    report = generate_report_json(
        manifest, scan_index, all_findings,
        verified, rejected, patches, security_index,
    )
    report_path = os.path.join(data_dir, "report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
        f.write("\n")

    print(json.dumps({
        "summaryPath": summary_path,
        "reportPath": report_path,
        "verified": len(verified),
        "rejected": len(rejected),
        "prsCreated": report["patch"]["prsCreated"],
        "securityFindings": len(security_index),
    }))


if __name__ == "__main__":
    main()
