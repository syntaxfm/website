# Warden Sweep Skill Specification

## Intent

The `warden-sweep` skill runs a full-repository Warden scan, verifies findings through deeper code tracing, and creates draft PRs for validated issues.

It exists for batch remediation work where a normal targeted Warden run is too narrow. The workflow is intentionally conservative: scan broadly, verify before patching, deduplicate against existing PRs, and record every decision in sweep artifacts.

## Scope

In scope:

- Scanning a repository file-by-file with Warden.
- Extracting and normalizing Warden findings.
- Verifying findings before any code changes are attempted.
- Creating a tracking issue for the sweep.
- Creating one draft PR per validated issue that passes patch triage.
- Organizing reports, security findings, PR links, and resumable sweep state.

Out of scope:

- Replacing human review of generated PRs.
- Applying fixes directly to the user's current branch.
- Patching low-confidence or unverified findings.
- Running generic codebase review without Warden scan artifacts.
- Managing CI iteration after PR creation.

## Users And Trigger Context

- Primary users: maintainers asking an agent to perform broad Warden-backed repository cleanup.
- Common user requests: "sweep the repo", "scan everything", "find all bugs", "full codebase review", "batch code analysis", "run Warden across the whole repository".
- Should not trigger for: normal pre-commit Warden runs, single-file checks, generic code review, or PR feedback iteration.

## Runtime Contract

- Required first actions:
  - Confirm the repository has the required tools: `warden`, `gh`, `git`, `jq`, and `uv`.
  - Run `scripts/scan.py` from the repository root using the host skill-root path.
  - Preserve the returned `runId` and `sweepDir`.
  - Resume existing sweep artifacts instead of duplicating work when a sweep directory is provided.
- Required outputs:
  - Phase summaries after scan, verification, issue creation, patching, and organization.
  - Final pointer to the generated summary report.
  - Explicit counts for scanned files, timeouts/errors, verified/rejected findings, created/existing/failed PRs, and security findings.
- Non-negotiable constraints:
  - Verify findings before patching.
  - Patch findings sequentially to avoid worktree and branch cross-contamination.
  - Create draft PRs, not direct commits to the default branch.
  - Record errors in sweep data and continue to the next finding when possible.
  - Clean up worktrees after patch attempts.
- Expected bundled files loaded at runtime:
  - `references/script-interfaces.md`
  - `references/scan-phase.md`
  - `references/verify-phase.md`
  - `references/issue-phase.md`
  - `references/patch-phase.md`
  - `references/organize-phase.md`
  - `references/resume-and-artifacts.md`
  - `references/verify-prompt.md`
  - `references/patch-prompt.md`
  - `scripts/*.py`

## Source And Evidence Model

Authoritative sources:

- `skills/warden-sweep/SKILL.md` and bundled references.
- `skills/warden-sweep/scripts/*.py`.
- Warden JSONL output schema and renderer code in `src/cli/output/`.
- GitHub CLI behavior for PRs, issues, labels, and repo metadata.

Useful improvement sources:

- positive examples: completed sweeps with verified findings, clean draft PRs, and accurate final reports
- negative examples: duplicate PRs, false positive patches, failed worktree cleanup, incorrect artifact state, or patch contamination across findings
- commit logs/changelogs: changes to Warden output, script behavior, or sweep artifact schema
- issue or PR feedback: reviewer complaints about generated PR quality, false positives, or sweep noise
- eval results: dry-run prompts for scan resume, verification, patch triage, and final organization

Data that must not be stored:

- secrets, credentials, or tokens
- private customer data
- raw issue/PR content unrelated to the sweep finding
- unredacted sensitive code excerpts beyond what is needed in local sweep artifacts

## Reference Architecture

- `SKILL.md` contains the phase overview, routing table, universal constraints, and completion contract.
- `SOURCES.md` contains source inventory, coverage, decisions, gaps, and changelog.
- `references/` contains focused phase runbooks, prompt templates, script interfaces, and artifact layout.
- `references/evidence/` is unused until durable examples are needed.
- `scripts/` contains repeatable automation for scan, extraction, issue creation, PR indexing, reviewer selection, report generation, and organization.
- `assets/` is unused.

## Evaluation

- Lightweight validation:
  - Run the skill validator against `skills/warden-sweep`.
  - Confirm every script mentioned in `SKILL.md` and references exists.
  - Confirm every phase reference has one clear lookup purpose.
- Deeper evaluation:
  - Run a dry sweep in a small fixture repository when script or artifact behavior changes.
  - Exercise resume paths for scan, verify, issue, patch, and organize phases.
- Holdout examples:
  - Store redacted false positive and duplicate-PR examples in `references/evidence/` if these failures recur.
- Acceptance gates:
  - Findings are verified before patching.
  - Patch phase creates isolated branches and draft PRs.
  - Existing overlapping PRs are detected before creating new PRs.
  - Final artifacts are resumable and summarize errors separately from successful work.

## Known Limitations

- The workflow depends on external CLIs and repository permissions.
- Verification and patching quality depends on the host agent's ability to inspect code deeply.
- The skill uses host-agent delegation when available; hosts without parallel delegation can run the same verification steps serially.
- Broad scans can be expensive and noisy if repository Warden configuration is too broad.

## Maintenance Notes

- Update `SKILL.md` when phase order, universal constraints, or routing changes.
- Update `SOURCES.md` when source inventory, decisions, coverage, or known gaps change.
- Update phase references when script arguments, output shapes, artifact schema, or error handling changes.
- Update prompt templates when verification or patch quality failures recur.
- Update `references/evidence/` when preserving redacted examples will improve future iterations.
