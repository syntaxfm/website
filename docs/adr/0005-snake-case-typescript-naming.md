# ADR-0005 — snake_case for TypeScript identifiers and module filenames

## Status

Accepted. Enforced by ESLint (`@typescript-eslint/naming-convention`) and Stylelint.

## Decision

Variables, functions, parameters, and `const` bindings are **snake_case**. Module filenames for utilities/state/server code are **snake_case.ts** (e.g. `format_show_type.ts`, `get_show_cache_ms.ts`). True top-level constants are `UPPER_SNAKE_CASE`. Types, interfaces, classes, and Svelte component files remain **PascalCase**.

## Why

The codebase predates the now-typical TypeScript convention of camelCase variables. The original author preferred snake_case and the codebase grew with it. A retroactive rename would touch thousands of identifiers across hundreds of files and serve no functional purpose.

Recording it here so that contributors and AI agents stop "fixing" snake_case to camelCase on the assumption that camelCase is the unspoken standard.

## Trade-offs

- Contributors arriving from typical TypeScript projects will reach for camelCase by reflex. ESLint will catch most cases.
- Some npm packages return camelCase data; **properties that come from external APIs may keep their source naming** (this is allowed by the lint config and explicitly noted in `AGENTS.md`).

## Rule

- `snake_case`: variables, functions, parameters, props, module filenames for non-component code.
- `PascalCase`: types, interfaces, classes, Svelte component files (`.svelte`).
- `UPPER_SNAKE_CASE`: true top-level constants only — not every `const`.
- External API property names: keep as-is (don't rename to fit local convention).

If you're tempted to rename a snake_case identifier to camelCase as "cleanup," don't.
