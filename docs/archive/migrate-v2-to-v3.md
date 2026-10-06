# Migration Guide: V2 (Prisma) to V3 (Drizzle) — superseded

> **Superseded. Do not follow this as a procedure.** It described the Prisma → Drizzle cutover
> while it was planned. Its central claims are not true of the current code:
>
> - `pnpm preheat` does **not** run during a build, a deploy, or `pnpm dev`, and it never touches
>   production. It sets up and migrates only the local Docker database, and reads production only
>   through `pg_dump` to copy it locally. Deploys run `pnpm build`.
> - Production is **not** migrated automatically by anything. See
>   [`schema-workflow.md`](../schema-workflow.md#production).
> - The functions and files this guide named — `ensureDrizzleMigrationSetup()` in
>   `scripts/preheat.js`, `scripts/prisma_to_drizzle.sql`, and the `0000_graceful_shaman` baseline
>   — no longer exist or no longer apply. `drizzle/0000_graceful_shaman.sql` survives only as a
>   legacy MySQL-era file outside the migrations folder.
> - Its manual SQL was written for the MySQL-era Drizzle setup and doesn't apply to Postgres.
>
> Current, authoritative references:
>
> - Local setup, env, and admin sign-in: the [README](../../README.md).
> - Schema changes, migrations, and local resets: [`schema-workflow.md`](../schema-workflow.md).
> - Why Drizzle + Postgres, and how local copies of production are baselined:
>   [ADR-0001](../adr/0001-drizzle-postgres-over-prisma-mysql.md).

## What the cutover changed

- **ORM**: Prisma → Drizzle.
- **Database**: MySQL (PlanetScale) → PostgreSQL; data moved with `scripts/direct-db-migration.js`
  (see [`postgres-migration-guide.md`](./postgres-migration-guide.md)).
- **Migration tool**: `prisma migrate` → `drizzle-kit`, with migrations in
  `drizzle/pg-migrations/` tracked in `drizzle.__drizzle_migrations`.
- **Schema location**: `prisma/schema.prisma` → `src/server/db/schema.ts`.
- **Types**: `@prisma/client` → `src/server/db/types.ts`.

Production's Postgres schema was built by the data-migration script rather than by replaying
migrations, so it has no migration history for the first migrations. `scripts/preheat.js` records
those (through `0001_puzzling_talos`) in **local** copies before applying newer migrations; it
does nothing of the kind to production.

For the full change history, see this repository's git history around the v3 release.
