# AGENTS.md

Working guide for agentic coding tools in this repository.
Prioritize: (1) correct commands, (2) repo style rules, (3) Cursor/Copilot rules.

## Project Snapshot

- Stack: SvelteKit 2 + Svelte 5 + TypeScript + Vite.
- Runtime target: Vercel Node.js 22.x (`svelte.config.js`).
- Package manager: `pnpm`.
- Active DB layer in app code: Drizzle + Postgres (`src/server/db/*`).
- Route groups: `src/routes/(site)` and `src/routes/(blank)`.
- Legacy docs sometimes mention Prisma/MySQL; prefer actual repo config/code.

## Build/Lint/Test Commands

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
  Run one Playwright test (important):
- Single file: `pnpm test -- tests/player.test.ts`
- Single test by name: `pnpm test -- -g "Player works episode button and check if audio is playing"`
- Single test by file:line: `pnpm test -- tests/default.test.ts:4`
- Headed single-file run: `pnpm test -- tests/player.test.ts --headed`
  Run one Vitest test (important):
- Single file via script args: `pnpm test:unit -- src/path/to/file.test.ts`
- Single test by name: `pnpm test:unit -- -t "does something specific"`
- Explicit run mode: `pnpm exec vitest run src/path/to/file.test.ts`

## Code Style and Conventions

### Formatting (enforced)

- Prettier is source of truth.
- Tabs required (`useTabs: true`).
- Single quotes required (`singleQuote: true`).
- `printWidth` is 100.
- `trailingComma` is `none`.

### ESLint rules (enforced)

- `@typescript-eslint/ban-ts-comment`: error.
- Unused vars fail unless prefixed with `_`.
- Naming in TS/JS:
  - Variables/functions/params: `snake_case`.
  - `const`: `snake_case` or `UPPER_CASE` for true constants.
  - Types/interfaces/classes: `PascalCase`.
  - Properties may keep source/API naming.
- `.svelte` variables may be `snake_case`, `UPPER_CASE`, or `PascalCase`.

### TypeScript guidance

- Strict mode is enabled (`strict: true`).
- JS is type-checked too (`allowJs` + `checkJs`).
- Prefer explicit types at API boundaries.
- Avoid enums; use string unions / const objects.

### Naming and files

- Components: `PascalCase.svelte`.
- Most utility/state/server modules: `snake_case.ts`.
- Variables/functions/props: `snake_case`.
- Constants: `UPPER_CASE` only when truly constant.
- Routes follow SvelteKit conventions (`+page`, `+layout`, `+server`, etc).

### Imports and boundaries

- Use aliases from `svelte.config.js`: `$actions`, `$assets`, `$const`, `$server`, `$shows`, `$state`, `$styles`, `$utilities`.
- Prefer alias imports for cross-folder code.
- Prefer relative imports for nearby files in the same feature.
- Keep imports consistent and readable; no assumed import-sort plugin.
- Keep server-only logic in `src/server/*` and server route modules.

### Svelte 5 patterns

- Prefer runes where appropriate: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
- Classes are acceptable for complex state machines.
- Async components are enabled; top-level `await` in Svelte is supported.

### Server/load/action/endpoint patterns

- Use svelte remote functions where possible for server data loading for components.
- Endpoints should return `json(...)` or `Response.json(...)` with explicit status/headers.
- Use SvelteKit `error(status, message)` for expected HTTP failures.
- Use SvelteKit `redirect(status, location)` for auth/navigation flow.
- Validate inbound form payloads (Valibot is already used in admin remote modules).

### Error handling

- Fail fast on required env vars (see `src/server/db/client.ts`).
- Catch and log contextual errors with `console.error(...)`.
- Do not silently swallow errors unless fallback behavior is intentional.
- Return actionable error messages for operators/API consumers.

### CSS/styling

- Use CSS variables from `src/styles/variables.css` and related style files.
- Prefer `bg`/`fg` semantic naming for color roles.
- Use custom media queries (stylelint enforces), e.g. `@media (--below-med)`.
- Color/font-size values are stylelint-restricted; use design tokens/variables.

### Components and reuse

- Always check for existing components and styles before creating new ones. Search the codebase first.
- Reuse and extend existing UI components rather than duplicating or reinventing them.
- Reuse existing CSS variables, utility classes, and design tokens instead of adding new styles that overlap with what already exists.
- All UI components must have a corresponding `.stories` file for Storybook documentation and visual testing.

### Testing conventions

- Playwright tests live in `tests/*.test.ts`.
- Vitest includes `src/**/*.{test,spec}.{js,ts}`.
- Keep tests deterministic and update tests when behavior changes.

## Cursor and Copilot Rules

- Repo includes `.cursorrules` and `.github/copilot-instructions.md`.
- They are near-identical and should be followed by agents.
- Shared guidance to preserve:
  - Be concise, technical, and performance-minded.
  - Use SvelteKit SSR/SSG and file-based routing conventions.
  - Favor functional/declarative code and modern Svelte 5 runes.
  - Prioritize strict typing, semantic HTML, accessibility, and minimal client JS.
- If Cursor/Copilot instructions conflict with repo config/lint, prefer repo config/lint.
