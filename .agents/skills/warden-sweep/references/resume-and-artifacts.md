# Resume And Artifacts

Use this reference when resuming a partial sweep or inspecting generated files.

## Resume Rules

Each phase is incremental:

1. Check `data/manifest.json` for phase state.
2. For scan, pass `--sweep-dir` to `scan.py`.
3. For verify, skip existing `data/verify/<id>.json` files.
4. For issue, `create_issue.py` skips if `issueUrl` exists in the manifest.
5. For patch, skip existing entries in `data/patches.jsonl`.
6. For organize, rerun safely.

Continue from the first incomplete phase. Do not start a new sweep unless the user asks for a clean run.

## Output Directory Structure

```text
.warden/sweeps/<run-id>/
  summary.md                        # Stats, key findings, PR links
  findings/                         # One markdown per verified finding
    <finding-id>.md
  security/                         # Security-specific view
    index.jsonl                     # Security findings index
    <finding-id>.md                 # Copies of security findings
  data/                             # Structured data for tooling
    manifest.json                   # Run metadata, phase state
    scan-index.jsonl                # Per-file scan tracking
    all-findings.jsonl              # Every finding from scan
    verified.jsonl                  # Findings that passed verification
    rejected.jsonl                  # Findings that failed verification
    patches.jsonl                   # Finding -> PR URL -> reviewers
    existing-prs.json               # Cached open Warden PRs
    report.json                     # Machine-readable summary
    verify/                         # Individual verification results
      <finding-id>.json
    logs/                           # Warden JSONL logs per file
      <hash>.jsonl
    pr-diffs/                       # Cached PR diffs for dedup
      <number>.diff
```

## Failure Handling

- Preserve partial artifacts.
- Record per-finding errors in the relevant JSONL file.
- Distinguish timed-out files from errored files.
- Clean up worktrees before retrying patch work.
- Re-run organize after manual recovery to refresh reports.
