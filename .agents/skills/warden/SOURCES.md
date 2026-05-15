# Warden Skill Sources

## Source Inventory

| Source | Trust tier | Confidence | Usage constraints |
|--------|------------|------------|-------------------|
| `skills/warden/SKILL.md` | canonical runtime | high | Keep concise; runtime instructions only. |
| `skills/warden/references/*.md` | bundled runtime references | high | Keep focused by lookup need. |
| `src/cli/` | implementation | high | Verify CLI flags and behavior here before changing examples. |
| `src/config/` and `src/types/` | implementation | high | Verify config field names, defaults, and validation rules here. |
| `packages/docs/src/pages/cli.astro` | generated/user docs source | medium | Useful for CLI descriptions, but implementation wins on conflicts. |
| `packages/docs/src/pages/config.astro` | generated/user docs source | medium | Useful for config examples, but implementation wins on conflicts. |
| `packages/docs/src/pages/skill.astro` | generated/user docs source | medium | Useful for install and skill-discovery language. |

## Coverage Matrix

| Dimension | Coverage status | Evidence |
|-----------|-----------------|----------|
| CLI surface | covered | `references/cli-reference.md` lists commands, targets, flags, exit codes, and examples. |
| Config/runtime options | covered | `references/configuration.md` and `references/config-schema.md` cover `warden.toml` structure, fields, defaults, triggers, and environment variables. |
| Common use cases | covered | `SKILL.md` covers run-before-commit, explicit skill runs, file targets, git refs, fix mode, and config edits. |
| Known issues/workarounds | partial | `references/configuration.md` has troubleshooting; CLI auth and install failures could use more detail. |
| Version/migration variance | partial | Remote skill pinning and cache behavior are documented; package-version migration notes are not maintained here. |

## Decisions

- Keep `SKILL.md` as a quick router because agents often need only a command, not the full CLI documentation.
- Keep CLI, config, schema, and skill creation in separate references so agents can load only the relevant detail.
- Keep Warden-specific skill creation guidance in this skill even though generic skill authoring belongs elsewhere, because Warden has its own discovery, config, and remote-skill behavior.

## Open Gaps

- Add or verify an auth/setup troubleshooting reference if repeated agent runs fail before Warden can execute.
- Confirm CLI examples after each release that changes flags, output modes, or init/add/sync behavior.
- Add migration notes if Warden introduces breaking config changes beyond `version = 1`.

## Changelog

- 2026-04-27: Reverse-engineered maintenance spec and source inventory from the distributed `warden` skill.
