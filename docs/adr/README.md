# Architecture Decision Records

Each ADR captures one decision that was hard to reverse, surprising without context, or the result of a real trade-off. They are numbered sequentially and never renumbered.

When you make a decision that fits all three criteria, add a new ADR with the next number. Keep them short — a single paragraph is fine. See [`../../.claude/skills/grill-with-docs/ADR-FORMAT.md`](../../.claude/skills/grill-with-docs/ADR-FORMAT.md) (if present) or the existing ADRs as a template.

## Index

- [0001 — Drizzle + Postgres (replacing Prisma + MySQL)](./0001-drizzle-postgres-over-prisma-mysql.md)
- [0002 — Text IDs, not UUIDs](./0002-text-ids-not-uuids.md)
- [0003 — Application-level validation, not CHECK constraints](./0003-no-check-constraints.md)
- [0004 — Unified `content` model wraps all content types](./0004-unified-content-model.md)
- [0005 — snake_case for TypeScript identifiers and module filenames](./0005-snake-case-typescript-naming.md)
- [0006 — Per-type admin editors are canonical; `/admin/content/[id]` removed](./0006-per-type-admin-editors.md) (supersedes part of ADR-0004)
