---
name: warden-sweep
description: Full-repository code sweep. Scans every file with Warden, verifies findings through deep tracing, creates draft PRs for validated issues. Use when asked to "sweep the repo", "scan everything", "find all bugs", "full codebase review", "batch code analysis", or run Warden across the entire repository.
disable-model-invocation: true
---

# Warden Sweep

Run a full-repository Warden sweep: scan files, verify findings, create a tracking issue, open draft PRs for validated issues, and organize the final report.

**Requires**: `warden`, `gh`, `git`, `jq`, `uv`.

Run commands from the repository root. Use the host's skill-root path for bundled scripts and references.

Output goes to `.warden/sweeps/<run-id>/`.

## References

Load only the reference for the current phase:

| Need | Read |
|------|------|
| Script arguments, outputs, and side effects | `references/script-interfaces.md` |
| Phase 1 scan workflow | `references/scan-phase.md` |
| Phase 2 verification workflow | `references/verify-phase.md` |
| Phase 3 tracking issue workflow | `references/issue-phase.md` |
| Phase 4 patch and draft PR workflow | `references/patch-phase.md` |
| Phase 5 organize and final report workflow | `references/organize-phase.md` |
| Resume behavior and artifact layout | `references/resume-and-artifacts.md` |
| Verification task prompt template | `references/verify-prompt.md` |
| Patch task prompt template | `references/patch-prompt.md` |

## Workflow

Track progress across phases:

- [ ] Phase 1: Scan repository files with Warden.
- [ ] Phase 2: Verify findings before patching.
- [ ] Phase 3: Create a tracking issue.
- [ ] Phase 4: Patch verified findings and open draft PRs.
- [ ] Phase 5: Organize results and produce the final report.

## Phase Order

1. Read `references/script-interfaces.md` once before running scripts.
2. Run Phase 1 from `references/scan-phase.md`. Save `runId` and `sweepDir`.
3. Run Phase 2 from `references/verify-phase.md`. Verify every finding before patching.
4. Run Phase 3 from `references/issue-phase.md`. Continue if issue creation fails.
5. Run Phase 4 from `references/patch-phase.md`. Patch sequentially, one finding at a time.
6. Run Phase 5 from `references/organize-phase.md`.
7. For interrupted or partial runs, read `references/resume-and-artifacts.md` and continue from the first incomplete phase.

## Non-Negotiable Rules

- Verify findings before creating fixes.
- Use draft PRs for generated patches.
- Branch every patch from the repository default branch.
- Patch findings sequentially; do not run patch workers in parallel.
- Skip existing entries in sweep artifacts instead of duplicating work.
- Record failures in sweep data and continue to the next finding when possible.
- Clean up each worktree after patch success or failure.

## Final Response

After organizing, report:

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
