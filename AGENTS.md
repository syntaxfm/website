# AGENTS.md

Working guide for agentic coding tools in this repository. This is the canonical agent-instruction file — `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md` are thin pointers to here.

Priority order when guidance conflicts: (1) actual repo config (`tsconfig.json`, `eslint.config.js`, `drizzle.config.ts`), (2) this file, (3) tool-specific files.

## Read before non-trivial work

For anything beyond a small targeted edit, read these first. They are short.

- [`docs/CONTEXT.md`](./docs/CONTEXT.md) — domain glossary. Defines **Show**, **Syntax**, **Host**, **Guest**, **Content**, and other terms that are overloaded or have changed meaning. If you write code that uses these words, read it first.
- [`docs/adr/`](./docs/adr/) — architecture decision records. Read the index at [`docs/adr/README.md`](./docs/adr/README.md). Especially relevant before changes to the database, ORM, ID strategy, content model, or naming conventions.

## When to update the docs

You are expected to maintain CONTEXT.md and the ADRs as you work, not in a separate cleanup pass.

**Update `docs/CONTEXT.md` when:**

- You introduce a new domain term.
- A user resolves an ambiguity between existing terms.
- You encounter a domain word being used in conflicting ways and pick a canonical version.
- A term in the glossary turns out to be wrong or outdated — correct it inline, don't leave a stale definition.

**Write a new ADR in `docs/adr/` when all three are true:**

1. The decision is **hard to reverse** (cost of changing your mind later is meaningful).
2. It would be **surprising without context** — a future reader will look at the code and ask "why on earth did they do it this way?"
3. There was a **real trade-off** — genuine alternatives existed and a specific one was chosen.

Examples that qualify: changing the ORM, swapping the auth provider, adopting a new write model, deviating from an obvious-looking path. Examples that do not qualify: bug fixes, library upgrades that ship without API change, formatting/style tweaks, anything reversible in an afternoon.

Number ADRs sequentially. Keep them short — one paragraph is often enough. See existing ADRs for the shape.

## Project snapshot

- Stack: SvelteKit 2 + Svelte 5 + TypeScript + Vite.
- Runtime target: Vercel Node.js 22.x (`svelte.config.js`).
- Package manager: `pnpm`.
- Database: PostgreSQL via Drizzle ORM. Schema in `src/server/db/schema.ts`. See [ADR-0001](./docs/adr/0001-drizzle-postgres-over-prisma-mysql.md).
- Legacy MySQL access path still exists at `src/server/db/x-*.ts` for the migration window — do not import from `x-*` in new code.
- Route groups: `src/routes/(site)` and `src/routes/(blank)`.

## Working discipline

These are the rules that an agent operating in this repo should default to. They exist because they have been violated and the cleanup has cost real time.

- **No scratch files at the repo root.** No `test.ts`, `tmp.js`, `scratch.md`, `notes.md`, `output.json`. Use `/scratch/` (gitignored) or work in your shell — not the tree.
- **No unsolicited documentation files.** Do not create planning docs, decision logs, "summary of changes" markdown, or analysis files unless the user asked for them. ADRs and CONTEXT.md updates are the exception, and only when criteria above are met.
- **Clean up after yourself in the same session.** If you write a test script to verify something, delete it before the turn ends unless it has lasting value as a real test in `tests/` or `src/**/*.test.ts`. No `.bak`, no `.old`, no `_v2` copies left around.
- **Prefer Edit over Write.** When changing an existing file, edit it — don't rewrite it whole. Don't introduce new files in the repo root.
- **No leftover TODOs or placeholder implementations.** Stub functions, `throw new Error('TODO')`, and no-op handlers don't ship. If something can't be wired now, don't merge it.
- **No console.log / dbg() / debugger left in committed code.** Use `console.error('context', err)` for genuine error logging at appropriate boundaries.

These are enforced by convention now; a Warden rule set may be added later to make some of them automatic.

## Build, lint, test commands

### Install and dev

- Install deps: `pnpm install`
- Prepare env-dependent setup: `pnpm preheat`
- Start dev server: `pnpm dev`
- Start Vite directly: `pnpm vite-dev`

### Build and preview

- Build production app: `pnpm build`
- Preview built app: `pnpm preview`

### Type checking

- Full typecheck: `pnpm check`
- Watch mode: `pnpm check:watch`

### Lint and formatting

- Full lint pipeline: `pnpm lint`
- ESLint only: `pnpm eslint`
- Stylelint only: `pnpm stylelint`
- Format all files: `pnpm format`

Single-file examples:

- ESLint one file: `pnpm exec eslint src/server/auth/sessions.ts`
- Stylelint one file: `pnpm exec stylelint src/lib/theme/ThemeToggle.svelte`
- Prettier check one file: `pnpm exec prettier --check src/routes/(site)/+page.svelte`

### Testing

- Playwright suite: `pnpm test`
- Playwright UI mode: `pnpm test:ui`
- Vitest suite: `pnpm test:unit`

Run one Playwright test:

- Single file: `pnpm test -- tests/player.test.ts`
- Single test by name: `pnpm test -- -g "Player works episode button and check if audio is playing"`
- Single test by file:line: `pnpm test -- tests/default.test.ts:4`
- Headed single-file run: `pnpm test -- tests/player.test.ts --headed`

Run one Vitest test:

- Single file via script args: `pnpm test:unit -- src/path/to/file.test.ts`
- Single test by name: `pnpm test:unit -- -t "does something specific"`
- Explicit run mode: `pnpm exec vitest run src/path/to/file.test.ts`

### Database

- Drizzle Studio: `pnpm drizzle-kit studio`
- Generate migration: `pnpm drizzle-kit generate`
- Apply migrations: `pnpm drizzle-kit migrate`
- Push schema (dev/staging): see `docs/schema-workflow.md`

## Code style and conventions

### Formatting (enforced by Prettier)

- Tabs required (`useTabs: true`).
- Single quotes required (`singleQuote: true`).
- `printWidth` is 100.
- `trailingComma` is `none`.

### ESLint rules (enforced)

- `@typescript-eslint/ban-ts-comment`: error.
- Unused vars fail unless prefixed with `_`.

### Naming — see [ADR-0005](./docs/adr/0005-snake-case-typescript-naming.md)

- Variables / functions / parameters: `snake_case`.
- `const`: `snake_case`, or `UPPER_CASE` for true constants only.
- Types / interfaces / classes: `PascalCase`.
- Module filenames for non-component code: `snake_case.ts`.
- Component files: `PascalCase.svelte`.
- Properties from external APIs may keep their source naming.

**Don't "fix" snake_case to camelCase.** It is deliberate. See the ADR.

### TypeScript

- Strict mode enabled (`strict: true`); JS is type-checked too (`allowJs` + `checkJs`).
- Prefer explicit types at API boundaries.
- Avoid `any` — prefer `unknown` at trust boundaries, then narrow.
- Avoid enums — use string literal unions or `const` objects.

### Imports and module boundaries

- Use aliases from `svelte.config.js`: `$actions`, `$assets`, `$const`, `$server`, `$shows`, `$state`, `$styles`, `$utilities`.
- Prefer alias imports across folders; relative imports for nearby files in the same feature.
- Keep server-only logic in `src/server/*` and server route modules.
- Never re-export types from intermediate modules; import directly from source.

## Svelte

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### Svelte 5 patterns

- Prefer runes: `$state`, `$derived`, `$props`, `$bindable`. Avoid `$effect` unless absolutely required.
- Classes are acceptable for complex state machines (see `src/state/`).
- Async components are enabled; top-level `await` in Svelte is supported.
- Components own their own data — read from global state/stores directly where used, don't drill props for store values.
- Do not create rename-only `$derived` aliases for existing manager/store values.

### Server / load / action / endpoint patterns

- Use Svelte remote functions where possible for server data loading.
- Endpoints return `json(...)` or `Response.json(...)` with explicit status/headers.
- Use SvelteKit `error(status, message)` for expected HTTP failures and `redirect(status, location)` for auth/navigation.
- Validate inbound form payloads (Valibot is already used in admin remote modules).

### Error handling

- Fail fast on required env vars (see `src/server/db/client.ts`).
- Catch and log contextual errors with `console.error('message', err)`.
- Do not silently swallow errors unless fallback behavior is intentional.

### CSS / styling

- Use CSS variables from `src/styles/variables.css`.
- `bg` / `fg` semantic naming for color roles.
- Use custom media queries (stylelint enforces): `@media (--below-med)`, `@media (--above-med)`, etc.
- Color / font-size values are stylelint-restricted; use design tokens.

### Components

- Always check for existing components and styles before creating new ones.
- Reuse and extend existing UI primitives instead of duplicating.
- All UI components should have a corresponding `.stories` file for Storybook.

## Database workflow

See [`docs/schema-workflow.md`](./docs/schema-workflow.md) for the full procedure and [`docs/schema-changelog.md`](./docs/schema-changelog.md) for the history.

Quick form for new work post-cutover:

1. Edit `src/server/db/schema.ts`.
2. `pnpm drizzle-kit generate` — review generated SQL.
3. `pnpm drizzle-kit migrate` locally; test.
4. Commit migration files in `drizzle/`.
5. Production migrations run automatically via `scripts/preheat.js`.

Major schema decisions (text IDs, no CHECK constraints, unified content model) live in [`docs/adr/`](./docs/adr/) — read those before proposing structural changes.

## Testing conventions

- Playwright tests live in `tests/*.test.ts`.
- Vitest includes `src/**/*.{test,spec}.{js,ts}`.
- Prefer role/text-based assertions over brittle selectors.
- Keep tests deterministic and independent.
- During iteration, run one file or one test title first (commands above).
