# Creating Skills

Skills are markdown files that tell Warden what to look for. They follow the [agentskills.io](https://agentskills.io) specification.

## Skill Discovery

Warden searches these directories in order (first match wins):

```
.warden/skills/{name}/SKILL.md   # Warden-local generated skills
.agents/skills/{name}/SKILL.md   # Primary (recommended)
.claude/skills/{name}/SKILL.md   # Backup (Claude Code convention)
```

If no repo-local skill matches, names fall back to Warden's built-in skills such as `security-review`.

## SKILL.md Format

```markdown
---
name: my-skill
description: What this skill analyzes
allowed-tools: Read Grep Glob
---

[Analysis instructions for the agent]

## What to Look For
- Specific issue type 1
- Specific issue type 2

## Output Format
Report findings with severity, location, and suggested fix.
```

## Available Tools

`Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Bash`, `Write`, `Edit`

Most review skills only need `Read`, `Grep`, and `Glob` for exploring context.

## Writing Checklist

- One skill, one concern ("security review" not "code quality")
- Clear criteria for what counts as an issue and at what severity
- Actionable findings that include how to fix
- Examples of good and bad code where helpful

## Remote Skills

Skills can be fetched from GitHub repositories:

```bash
# Add a remote skill
warden add --remote <org>/<repo> --skill <skill-name>

# Add with version pinning (recommended for reproducibility)
warden add --remote <org>/<repo>@<ref> --skill <skill-name>

# List skills in a remote repo
warden add --remote <org>/<repo> --list

# Update all unpinned remote skills
warden sync

# Update specific repo
warden sync <org>/<repo>

# Run with cached skills only (no network)
warden --offline
```

**Remote skill in warden.toml:**

```toml
[[skills]]
name = "my-skill"
remote = "<org>/<repo>@<ref>"

[[skills.triggers]]
type = "pull_request"
actions = ["opened", "synchronize"]
```

**Cache location:** `~/.local/warden/skills/` (override with `WARDEN_STATE_DIR`)

**Cache TTL:** 24 hours for unpinned refs (override with `WARDEN_SKILL_CACHE_TTL` in seconds)
