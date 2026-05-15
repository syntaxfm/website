# Warden Skill Specification

## Intent

The `warden` skill teaches coding agents how to run Warden during local development, interpret its output, and update Warden configuration or skill definitions when asked.

It exists as the lightweight runtime companion to the Warden CLI. The skill should get agents to the right command or reference quickly without duplicating the full product documentation.

## Scope

In scope:

- Running Warden against uncommitted changes, explicit files, or git refs.
- Reading and editing `warden.toml`.
- Explaining Warden CLI flags, exit codes, severity thresholds, and output modes.
- Creating or wiring local Warden analysis skills.
- Directing agents to focused bundled references for detailed CLI, config, and skill-authoring behavior.

Out of scope:

- Replacing Warden product documentation.
- Running full-repository batch sweeps; use `warden-sweep` for that workflow.
- Defining project-specific review policy.
- Teaching generic agent skill authoring beyond Warden-specific discovery and config.

## Users And Trigger Context

- Primary users: coding agents working in repositories that use Warden.
- Common user requests: "run warden", "check my changes", "review before commit", "update warden.toml", "add a Warden trigger", "create a Warden skill".
- Should not trigger for: ordinary code review requests with no Warden context, generic testing, PR writing, or full-repository sweep requests.

## Runtime Contract

- Required first actions:
  - Identify whether the user wants to run Warden, edit config, inspect output, or create/update a Warden skill.
  - Load only the reference needed for that task.
  - Prefer local repository configuration over generic examples.
- Required outputs:
  - For runs: summarize command used, findings count, failure threshold, and next action.
  - For config edits: state the changed trigger or setting and how to validate it.
  - For skill creation: state where the skill was created and how it is referenced.
- Non-negotiable constraints:
  - Do not loop Warden repeatedly on unchanged work.
  - Do not invent config fields; check `references/config-schema.md` for exact names.
  - Do not treat Warden findings as advisory text to suppress; fix the code or explicitly explain why a finding is not actionable.
- Expected bundled files loaded at runtime:
  - `references/cli-reference.md`
  - `references/configuration.md`
  - `references/config-schema.md`
  - `references/creating-skills.md`

## Source And Evidence Model

Authoritative sources:

- Warden CLI behavior in `src/cli/`.
- Warden config loading and schemas in `src/config/` and `src/types/`.
- Documentation pages in `packages/docs/src/pages/`.
- Existing runtime references in `skills/warden/references/`.

Useful improvement sources:

- positive examples: agent sessions where Warden was run once, findings were fixed, and config edits used valid schema fields
- negative examples: repeated Warden reruns with no changes, invented config fields, stale CLI flags, or generic skill instructions that do not match Warden discovery
- commit logs/changelogs: CLI flag changes, config schema changes, and skill discovery changes
- issue or PR feedback: reports of confusing Warden setup, missing command coverage, or stale agent skill docs
- eval results: local prompts covering run, config, output interpretation, and skill creation paths

Data that must not be stored:

- secrets, tokens, or API keys
- customer data
- private repository URLs or identifiers not needed for reproduction
- raw Warden logs containing sensitive code or findings

## Reference Architecture

- `SKILL.md` contains task routing, quick commands, core constraints, and the reference map.
- `SOURCES.md` contains source inventory, coverage, gaps, and changelog.
- `references/` contains focused CLI, config, schema, and Warden skill creation guides.
- `references/evidence/` is unused until repeated examples need durable storage.
- `scripts/` is unused; this skill delegates execution to the installed `warden` CLI.
- `assets/` is unused.

## Evaluation

- Lightweight validation:
  - Run the skill validator against `skills/warden`.
  - Check that every referenced bundled file exists.
  - Spot-check CLI flags and config fields against source or generated docs.
- Deeper evaluation:
  - Exercise prompts for running Warden, adding a trigger, explaining output, and creating a skill.
- Holdout examples:
  - Preserve only redacted examples if recurring failures appear.
- Acceptance gates:
  - `SKILL.md` stays concise and routes to focused references.
  - Long references include navigation.
  - Config examples use valid field names.
  - Trigger description catches Warden-specific local development tasks without matching generic code review.

## Known Limitations

- The skill assumes the `warden` CLI is installed and authenticated where required.
- CLI and config details can drift when source changes without updating the bundled references.
- Some host agents expose different skill-root variables; references are written as bundled file paths, while examples may need host-specific substitution.

## Maintenance Notes

- Update `SKILL.md` when task routing, trigger language, or universal run constraints change.
- Update `SOURCES.md` when source inventory, decisions, coverage, or gaps change.
- Update references when CLI flags, config fields, remote skill behavior, or examples change.
- Update `references/evidence/` only for durable positive or negative examples that should guide future iterations.
