# Organize Phase

Finalize sweep artifacts, security views, PR links, and the summary report.

## Run

```bash
uv run <skill-root>/scripts/organize.py ${SWEEP_DIR}
```

## Process

1. Parse the JSON stdout.
2. Confirm `summary.md` and `data/report.json` were produced.
3. If the script fails, show the error and note which phases completed.
4. Update the checklist: Phase 5 complete.

## Report Template

```markdown
## Sweep Complete

| Metric | Count |
|--------|-------|
| Files scanned | {filesScanned} |
| Findings verified | {verified} |
| PRs created | {prsCreated} |
| Security findings | {securityFindings} |

Full report: `{summaryPath}`
```
