---
name: syntax-fallow
description: Use when running Fallow on the Syntax website — finding dead code, unused exports/dependencies, duplication, complexity, or circular deps. Fallow is tuned for this repo (`.fallowrc.json` + a committed baseline), so findings are trustworthy candidates — but still verify before removing (use dry-run, trace, then `pnpm check`/`build`/QA), never blind `fallow fix --yes`. Covers how to run it, what the config already handles, and how to maintain the baseline.
---

# Syntax + Fallow

Fallow is a Rust-native JS/TS analyzer (dead code, unused exports/deps,
duplication, complexity, circular deps, boundary violations). The installed
**`fallow` skill** owns the CLI mechanics — commands, flags, JSON shapes, and
its `references/` docs. Use it for *how to run* a command. **This** skill owns
how Fallow is wired into this repo and how to act on its output safely.

## State: tuned

This repo is configured — `.fallowrc.json` exists and a baseline is committed at
`.fallow/baseline.json` (caches in `.fallow/` are gitignored). A clean run that
was 331 raw findings is **72 real candidates** after tuning. So findings are now
mostly signal, not noise — but Fallow does pure syntactic analysis (no TS
compiler, no runtime), so the rule still holds:

- **Never run `fallow fix` to apply** (the `--yes` form). `fallow fix --dry-run`
  to preview is fine; apply removals yourself after verifying each.
- **Verify before deleting** a file/export/dep: trace it, grep for callers,
  then prove it with `pnpm check` + `pnpm build` (and `syntax-qa` for anything
  user-facing). Don't batch-delete on the report alone.

## What the config + plugins already handle

Don't re-flag these — they're covered:

- **Fallow's SvelteKit plugin** recognizes route files (`+page`, `+server`,
  `+layout`, `hooks.server.ts`), param matchers (`src/params/*`), `load`/
  `actions`/`GET` contracts, and **remote functions (`*.remote.ts`)** — RPC
  exports are *not* flagged. The **Storybook plugin** covers `*.stories.*`. The
  **Drizzle** plugin understands the ORM. (Earlier worry about remote functions
  and stories being false positives: handled by the plugins, no config needed.)
- **`.fallowrc.json` adds:**
  - `ignorePatterns: ["src/generated/**"]` — generated Prisma client (~175
    findings). Never hand-edit generated code on Fallow's say-so.
  - `entry: ["scripts/**/*.js"]` — standalone ops scripts are roots, not unused.
  - `ignoreUnresolvedImports: ["/api/57475/script.js"]` — `app.html` references a
    runtime route, not a module.
  - `overrides` for `src/server/db/**`: `unused-exports`/`unused-types` = `off` —
    the schema/relations/row-types are a deliberate typed data-model surface.
  - `rules`: cosmetic categories (`unused-exports`, `unused-types`,
    `unused-class-members`, props, load-keys, type-/test-only deps) set to
    `warn` during adoption, so they don't gate. Files/deps/imports stay `error`.

If a new whole *class* of false positive appears, fix it in `.fallowrc.json`
(an `ignorePatterns`/`entry`/`override`), not with scattered inline
`fallow-ignore` comments. Reserve `@expected-unused` / `fallow-ignore` for
genuine one-off intentional cases.

## Running it

Fallow is not a dependency — run on demand with `pnpm dlx fallow`. Always
`--format json --quiet`.

```bash
# Full project (compares to the committed baseline — shows only NEW debt)
pnpm dlx fallow dead-code --format json --quiet --baseline .fallow/baseline.json

# Review just your branch (PR-style verdict, auto-detects base)
pnpm dlx fallow audit --format json --quiet --base main

# Targeted analyses
pnpm dlx fallow dupes  --format json --quiet --changed-since main
pnpm dlx fallow health --format json --quiet            # advisory only
```

- The **baseline grandfathers the current 72 known issues** — a run with
  `--baseline` only fails on *new* findings. That's the gate for ongoing work.
- A bare `fallow dead-code` (no `--baseline`) shows the full known debt — use it
  when you're actively burning the punch list down.
- Never run `fallow watch` (never exits).

## Acting on findings

1. **Classify.** New finding not in the baseline → triage now. Pre-existing
   (in the baseline) → it's known debt, fix opportunistically.
2. **Trace + grep.** `fallow ... --trace src/x.ts:name` plus a repo grep for the
   symbol/route. The most common true-positive here is an **unnecessary `export`
   keyword** on a symbol only used in its own file (e.g. the hooks composed via
   `sequence()` in `hooks.server.ts`) — dropping `export` is safe and cheap.
3. **Prove removal is safe.** Remove one item, run `pnpm check` + `pnpm build`;
   QA user-facing changes with `syntax-qa`. One at a time.
4. **Duplication is not auto-extract.** Confirm a clone group is real domain
   duplication, not coincidental boilerplate or intentionally-parallel admin
   remote modules. If you extract, shared pure helpers go in `src/lib/utils/*`,
   keep `snake_case`, no thin wrappers.
5. **Never rename `snake_case` → `camelCase`** while "cleaning up" (ADR-0005).
6. **Circular deps / boundary violations** are worth fixing; **health /
   complexity** output is advisory — prioritize refactors, don't auto-change.

## Maintaining the baseline

After you remove dead code, re-save the baseline so it ratchets down:

```bash
pnpm dlx fallow dead-code --format json --quiet --save-baseline .fallow/baseline.json
```

Commit `.fallowrc.json` and `.fallow/baseline.json` (the `.fallow/.gitignore`
keeps `cache.bin`/`graph-cache.bin` out). Goal over time: drive the 72 toward 0,
then the bare run is the gate and the baseline is just history.

## Finish with evidence

Report findings as **new (vs baseline)** vs **known debt**. For anything
removed, state that you traced it, that `pnpm check`/`pnpm build` pass, and that
affected UI was QA'd. Never report "removed N dead exports" without that.

See also: `syntax-code-quality` (Prettier/ESLint/Stylelint/svelte-check) and
`syntax-qa` (manual behavior QA).
