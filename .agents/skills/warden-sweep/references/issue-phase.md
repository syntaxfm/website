# Issue Phase

Create a tracking issue that ties all generated PRs together and gives reviewers one overview.

## Run

```bash
uv run <skill-root>/scripts/create_issue.py ${SWEEP_DIR}
```

## Process

1. Parse the JSON stdout.
2. Save `issueUrl` and `issueNumber`.
3. If the script fails, show the error and continue to the patch phase. PRs can still be created without a tracking issue.
4. Update the checklist: Phase 3 complete.

## Report Template

```markdown
## Tracking Issue Created

{issueUrl}
```
