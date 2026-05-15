# Scan Phase

Run Warden across repository files and collect normalized findings.

## Run

```bash
uv run <skill-root>/scripts/scan.py
```

To scan only specific files:

```bash
uv run <skill-root>/scripts/scan.py src/foo.ts src/bar.ts
```

To resume a partial scan:

```bash
uv run <skill-root>/scripts/scan.py --sweep-dir .warden/sweeps/<run-id>
```

## Process

1. Parse the JSON stdout.
2. Save `runId` and `sweepDir`.
3. Treat exit code `1` as fatal and stop.
4. Treat exit code `2` as partial: report timed-out and errored files separately, then continue only if the user accepts the partial results.
5. Render every finding from the `findings` array.
6. Update the checklist: Phase 1 complete.

## Report Template

```markdown
## Scan Complete

Scanned **{filesScanned}** files, **{filesTimedOut}** timed out, **{filesErrored}** errors.

### Findings ({totalFindings} total)

| # | Severity | Skill | File | Title |
|---|----------|-------|------|-------|
| 1 | **HIGH** | security-review | `src/db/query.ts:42` | SQL injection in query builder |
```

Bold severity for high and above.
