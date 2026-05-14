# ADR-0001 — Drizzle + Postgres (replacing Prisma + MySQL)

## Status

Accepted. v3 migration completed in November 2025.

## Decision

The application uses **Drizzle ORM** against **PostgreSQL**. The previous stack was Prisma against MySQL (PlanetScale). Schema source of truth is `src/server/db/schema.ts`. Migrations are tracked in the `__drizzle_migrations` table and applied automatically by `scripts/preheat.js` on dev startup and production deploy.

## Why

- **Drizzle gives us first-class SQL.** The Postgres feature set we wanted (`tsvector` full-text search, GIN indexes, expression indexes, partial indexes) is awkward through Prisma's generated client. Drizzle lets us declare these directly in `src/server/db/schema.ts` and use raw `sql\`\`` where the type system can't help.
- **Postgres unlocks server-side search.** Shows and guests now carry `search_vector` columns indexed with GIN, removing the need to push that work to FlexSearch / a worker for many queries. Transcript-side search is deferred (see "Deferred" below).
- **PlanetScale's MySQL constraints were limiting.** No native arrays, no `tsvector`, varchar-only string columns. Postgres treats `text` and `varchar` identically performance-wise, so all `varchar(N)` limits were dropped on the way over.

## Trade-offs

- **Drizzle's generated client is less ergonomic than Prisma's** for some join shapes. We accepted this for the schema-level control.
- **Migration tracking is hand-rolled in `preheat.js`** rather than provided by the ORM. See `scripts/preheat.js → ensureDrizzleMigrationSetup()`.
- **Some Drizzle features are still gaps** (e.g. `tsvector` type support). We use `sql\`\`` for those columns.

## Deferred

- Full-text search on transcripts (millions of rows, would slow every migration). Tracked separately.
- PostgreSQL triggers to auto-update `search_vector` on write. Currently populated by migration script and would need to move to triggers (or application writes) for live updates.

## Migration mechanics

The MySQL → Postgres data move was handled by `scripts/direct-db-migration.js`, supporting `--mode=refresh|upsert`, `--incremental`, `--skip-transcripts`, `--transcripts-only`, and `--skip-invalid-fk`. See `docs/archive/postgres-migration-guide.md` for the historical procedure and `docs/archive/migrate-v2-to-v3.md` for the Prisma → Drizzle cutover specifics.

The legacy MySQL access path remains in `src/server/db/x-*.ts` (`x-schema.ts`, `x-relations.ts`, `x-client.ts`) for any final reconciliation work. New code should not import from `x-*` — those files are kept only for the migration window.
