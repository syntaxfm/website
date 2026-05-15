# Script Interfaces

Use this reference before running Warden Sweep scripts. Run scripts from the repository root and pass the host skill-root path.

## Contents

- `scan.py`
- `index_prs.py`
- `create_issue.py`
- `organize.py`
- `extract_findings.py`
- `generate_report.py`
- `find_reviewers.py`

## `scripts/scan.py`

Runs setup and scan in one call: generates a run ID, creates the sweep directory, checks dependencies, creates the `warden` label, enumerates files, runs Warden per file, writes `scan-index.jsonl`, and extracts findings.

```bash
uv run <skill-root>/scripts/scan.py [file ...]
uv run <skill-root>/scripts/scan.py --sweep-dir .warden/sweeps/<run-id>
```

Stdout JSON:

```json
{
  "runId": "abc123",
  "sweepDir": ".warden/sweeps/abc123",
  "filesScanned": 10,
  "filesTimedOut": 0,
  "filesErrored": 0,
  "totalFindings": 3,
  "findings": []
}
```

Exit codes: `0` success, `1` fatal error, `2` partial scan.

## `scripts/index_prs.py`

Fetches open Warden-labeled PRs, builds a file-to-PR dedup index, and caches diffs for overlapping PRs.

```bash
uv run <skill-root>/scripts/index_prs.py <sweep-dir>
```

Stdout JSON includes `fileIndex`. Side effects:

- writes `data/existing-prs.json`
- writes `data/pr-diffs/<number>.diff` for overlapping PRs

## `scripts/create_issue.py`

Creates a GitHub tracking issue summarizing verified sweep results.

```bash
uv run <skill-root>/scripts/create_issue.py <sweep-dir>
```

Stdout JSON:

```json
{
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "issueNumber": 123
}
```

Idempotent: skips creation when `issueUrl` already exists in the manifest.

## `scripts/organize.py`

Tags security findings, labels security PRs, updates finding reports with PR links, posts final results to the tracking issue, generates the summary report, and finalizes the manifest.

```bash
uv run <skill-root>/scripts/organize.py <sweep-dir>
```

Stdout JSON includes final sweep counts and report paths. Side effects:

- creates `security/index.jsonl`
- copies security finding reports to `security/`
- creates or reuses the `security` GitHub label
- labels security PRs
- appends PR links to `findings/*.md`
- writes `summary.md` and `data/report.json`
- updates `phases.organize` in `data/manifest.json`

## `scripts/extract_findings.py`

Parses Warden JSONL log files and extracts normalized findings. Usually called by `scan.py`.

```bash
uv run <skill-root>/scripts/extract_findings.py <log-path-or-directory> -o <output.jsonl>
```

Writes one normalized finding per line to `<output.jsonl>`.

## `scripts/generate_report.py`

Builds `summary.md` and `report.json` from sweep data. Usually called by `organize.py`.

```bash
uv run <skill-root>/scripts/generate_report.py <sweep-dir>
```

Side effects:

- writes `<sweep-dir>/summary.md`
- writes `<sweep-dir>/data/report.json`

## `scripts/find_reviewers.py`

Finds the top two git contributors for a file from the last 12 months.

```bash
uv run <skill-root>/scripts/find_reviewers.py <file-path>
```

Stdout JSON:

```json
{
  "reviewers": ["user1", "user2"]
}
```
