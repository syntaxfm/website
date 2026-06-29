---
name: syntax-code-quality
description: Use when fixing formatting, lint, or type errors in the Syntax website; running Prettier / ESLint / Stylelint / svelte-check and resolving what they report; cleaning a change up to pass `pnpm lint` and `pnpm check` before commit. Drives the autofixers (the repo's lint scripts only check, they don't fix).
---

# Syntax Code Quality

Use to bring a change into compliance with the repo's formatter, linters, and
type checker. `pnpm lint` only **reports** problems — this skill drives the
fixers, auto-fixes what's safe, hand-fixes the rest, and loops until the changed
files are clean.

Default scope is the **changed files**, not the whole repo. Do not mass-reformat
untouched files — it buries the real diff.

## Establish Scope First

```bash
git diff --name-only            # unstaged changes
git diff --name-only --staged   # staged changes
```

Run the tools against those paths (or the files you just edited). Use the
repo-wide commands only when intentionally doing a full sweep.

## The Toolchain (fix in this order)

| Tool         | Fix command (scoped)                                     | Auto-fixable?                          |
| ------------ | -------------------------------------------------------- | -------------------------------------- |
| Prettier     | `pnpm exec prettier --write <files>`                     | Yes — pure formatting, safe            |
| ESLint       | `pnpm exec eslint <files> --fix`                         | Partly — rest is manual                |
| Stylelint    | `pnpm exec stylelint "<glob>" --fix`                     | Partly — strict rules are manual       |
| svelte-check | `pnpm check`                                             | No — every error is hand-fixed         |

Repo-wide equivalents: `pnpm format` (Prettier write-all), `pnpm eslint`,
`pnpm stylelint`, `pnpm check`. Verify with `pnpm lint` (check-only:
Prettier `--check` + ESLint + Stylelint).

Run order matters: format first (Prettier rewrites layout), then ESLint `--fix`,
then Stylelint `--fix`, then svelte-check last (type errors are unaffected by
the others and are fixed by hand).

## 1. Prettier

Run `pnpm exec prettier --write <files>`. Config is fixed and non-negotiable —
do not argue with it: tabs, single quotes, `printWidth` 100, `trailingComma`
none. This step should produce no manual work.

## 2. ESLint

Run `pnpm exec eslint <files> --fix`, then resolve what remains:

- **Unused vars** fail unless prefixed `_`. Prefer removing the dead binding; use
  `_name` only when the parameter must stay for arity/positional reasons.
- **`ban-ts-comment` is an error.** Do not add `// @ts-ignore` /
  `// @ts-expect-error` to silence type problems — fix the cause in step 4.
- Never add `// eslint-disable-*` to make a rule pass. Fix the code, or if the
  rule is genuinely wrong for the case, raise it rather than suppressing inline.

## 3. Stylelint

Run `pnpm exec stylelint "<glob>" --fix` (e.g. a single
`src/lib/.../Thing.svelte`, or `"**/*.{css,svelte}"` for a sweep). `--fix`
handles ordering and trivial issues; the strict rules are **manual**:

- **`declaration-strict-value`** — raw color and font-size values are rejected.
  Replace with design tokens from `src/styles/variables.css` (semantic `bg` /
  `fg` color roles, `--fs-*` sizes).
- **custom-media** — use the project queries: `@media (--below-med)`,
  `@media (--above-large)`, etc. (breakpoints at 400 / 700 / 900 / 1200).
- **unknown-custom-property** — only reference custom properties that actually
  exist; a typo'd `var(--…)` fails.

Reach for an existing token before inventing one; check `src/styles/` first.

## 4. svelte-check

Run `pnpm check`. Nothing here auto-fixes — work the reported errors by hand:

- Narrow `unknown` at trust boundaries before property access; avoid `any`.
- Keep explicit types at API boundaries (remote functions, endpoints).
- For `.svelte` files, use the **svelte MCP** `svelte-autofixer` tool on the
  component and re-run it until it returns no issues, then re-run `pnpm check`.

## Guardrails

- **Never rename `snake_case` → `camelCase`** to "tidy" things. It is deliberate
  (ADR-0005). The fixers won't do this; neither should you.
- **Behavior must not change.** These are formatting/lint/type fixes, not
  refactors. If a fix forces a logic change, stop and treat it as a real change
  — QA it (`syntax-qa`) and run `pnpm test:unit` for touched logic.
- **Don't suppress to pass.** No inline disables, no `@ts-expect-error`, no
  loosening configs. Make the code correct.
- **Stay in scope.** Fix the changed files; don't sweep the repo unless asked.

## Finish When

- The changed files pass `pnpm lint` and `pnpm check` clean.
- No suppression comments were added to get there.
- Report what was auto-fixed vs hand-fixed, and anything you intentionally left
  (e.g. a pre-existing error outside your change's scope).

## Structural analysis is a separate concern

This skill is style/lint/types — file-by-file, no logic changes. For **dead
code, unused exports/deps, duplication, complexity, or circular deps**, use the
`syntax-fallow` skill instead. Fallow operates on the module graph and can
delete real code; it has its own guardrails (it's untuned for this SvelteKit
repo) and must not be run as a blind autofix.
