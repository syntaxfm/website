# Warden Sweep Sources

## Source Inventory

| Source | Trust tier | Confidence | Usage constraints |
|--------|------------|------------|-------------------|
| `skills/warden-sweep/SKILL.md` | canonical runtime | high | Keep as router and phase overview. |
| `skills/warden-sweep/references/*.md` | bundled runtime references | high | Keep focused by phase or lookup need. |
| `skills/warden-sweep/scripts/*.py` | executable workflow | high | Script interfaces in references must match these files. |
| `src/cli/output/jsonl.ts` | Warden output contract | high | Verify JSONL parsing assumptions when Warden output changes. |
| `src/output/renderer.ts` and `src/types/` | finding/report semantics | high | Verify severity, confidence, and finding fields here. |
| GitHub CLI commands used by scripts | external tool contract | medium | Confirm command flags when GitHub CLI behavior changes. |

## Coverage Matrix

| Dimension | Coverage status | Evidence |
|-----------|-----------------|----------|
| Workflow phases | covered | `SKILL.md` routes scan, verify, issue, patch, organize, and resume behavior to focused references. |
| Script interfaces | covered | `references/script-interfaces.md` lists scripts, arguments, outputs, and side effects. |
| Artifact schema | covered | `references/resume-and-artifacts.md` documents directories and key JSONL/JSON files. |
| Verification behavior | covered | `references/verify-phase.md` and `references/verify-prompt.md` define qualification and rejection behavior. |
| Patch behavior | covered | `references/patch-phase.md` and `references/patch-prompt.md` define triage, worktree isolation, draft PR creation, and cleanup. |
| Known issues/workarounds | partial | Resume, partial scans, skipped findings, and existing PR dedup are covered; CI follow-up and rate-limit recovery are not. |
| Version/migration variance | partial | Current artifact names and script interfaces are documented; no formal migration path exists for old sweep directories. |

## Decisions

- Split phase detail out of `SKILL.md` so agents load only the current phase instructions.
- Keep script interface documentation separate from phase runbooks because scripts are reused across phases and by resume workflows.
- Describe verification and patch work in host-neutral terms while allowing parallel agent tasks when the host supports them.
- Keep prompt templates as separate references because they are substituted into delegated verification and patch work.
- Keep generated sweep artifacts under `.warden/sweeps/<run-id>/` so runs are resumable and isolated from normal source files.

## Open Gaps

- Add a redacted fixture sweep to validate the full workflow without touching real GitHub repositories.
- Document rate-limit and permission failure recovery if these become common in real sweeps.
- Add migration notes if artifact schemas change after users have existing sweep directories.
- Consider adding a script-level dry-run mode for issue and PR creation.

## Changelog

- 2026-04-27: Reverse-engineered maintenance spec and split the distributed `warden-sweep` workflow into phase references.
