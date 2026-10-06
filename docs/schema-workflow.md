# Schema Evolution Workflow

How to change the Drizzle/Postgres schema, and how to manage the local database while you do.

> **History**: this file used to describe the MySQL → PostgreSQL transition (`pnpm db:pg:*`
> commands, `scripts/verify-pg-schema.js`, dual-schema edits). That cutover is complete and those
> commands and scripts no longer exist. The record lives in [`archive/`](./archive/README.md).

## Current state

| What                     | Where                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Schema source of truth   | `src/server/db/schema.ts` (relations in `src/server/db/relations.ts`)                    |
| Migrations               | `drizzle/pg-migrations/` (SQL, `meta/` snapshots and `_journal.json`)                    |
| Migration tool           | `drizzle-kit` via `drizzle.config.ts`, tracked in `drizzle.__drizzle_migrations`         |
| Local database           | Docker Postgres 18 from `docker-compose.yml`, `localhost:5434`, database `local`         |
| Local setup and refresh  | `pnpm preheat` / `pnpm db:pull` (`scripts/preheat.js`; see the README)                   |
| Legacy MySQL access path | `src/server/db/x-*.ts` and `drizzle/*.sql` — do not use in new code                      |

Drizzle model names and table names differ: the model `show` is the `shows` table, `profile` is
`profiles`, `article` is `articles`, `showToProfile` is `show_to_profile`. See
[`CONTEXT.md`](./CONTEXT.md) for what each one means.

### Which database a command touches

- The app and `drizzle-kit` use `POSTGRES_DATABASE_URL` if it is set, otherwise `DATABASE_URL`
  (default: the local Docker database). **Keep `POSTGRES_DATABASE_URL` unset locally**; a value in
  `.env`, `.env.local`, or your shell redirects `pnpm dev`, `pnpm drizzle-kit …`, and the `db:*`
  scripts to that database. `pnpm exec varlock load` shows whether it is set, with the value masked.
- `pnpm preheat` and `pnpm db:pull` always run migrations against the local database, whatever
  the env says. Use them when you want that guarantee.
- `PROD_DATABASE_URL` is read only by `pnpm preheat` / `pnpm db:pull`, only with `pg_dump`, and
  only to copy production into an empty or explicitly replaced local database.

### Production

`pnpm preheat` and `pnpm db:pull` migrate only the local Docker database. `pnpm dev`, the build,
and a deploy (Vercel runs `pnpm build`) do not run migrations automatically. Other database tools
use the configured application URL, so a remote override can target production. Applying a
migration to production is a separate, deliberate step taken by a maintainer with production
access after review, in the order the change's [changelog](./schema-changelog.md) entry gives
relative to the app deploy. This document has no recipe for it, and agents never do it.

Production predates migration tracking: see
[ADR-0001](./adr/0001-drizzle-postgres-over-prisma-mysql.md) for how local copies are baselined.

## Standard workflow

1. **Plan the change.** Additive changes (new tables, nullable columns, indexes) are low risk.
   Renames, drops, type changes, and new `NOT NULL` constraints are breaking; see
   [Breaking changes](#breaking-changes). Read the [ADRs](./adr/README.md) first for structural
   changes (text IDs, no CHECK constraints, the `content` model).
2. **Edit `src/server/db/schema.ts`** (and `relations.ts` if relations change).
3. **Generate a migration:** `pnpm db:generate` (same as `pnpm drizzle-kit generate`). It compares
   the schema with the latest snapshot in `drizzle/pg-migrations/meta/`; it doesn't connect to a
   database.
4. **Review the SQL** in the new `drizzle/pg-migrations/NNNN_*.sql`. drizzle-kit can turn a rename
   into a drop and add; fix it by hand to a rename where needed. Data backfills go here too.
5. **Apply it locally:** `pnpm preheat`. It skips the production copy when the local database
   already has data, then runs `drizzle-kit migrate` with `DATABASE_URL` set to the local database
   and `POSTGRES_DATABASE_URL` cleared.
6. **Test** with `pnpm dev`, `pnpm check`, and the relevant tests.
7. **Commit** the schema change, the migration SQL, its snapshot, and `_journal.json` together,
   and add an entry to [`schema-changelog.md`](./schema-changelog.md) with deployment notes.

### Don't `push` shared databases

`pnpm db:push` (also `pnpm i-changed-the-schema`) runs `drizzle-kit push`, which changes a
database to match the schema **without writing a migration**. Production's content model and
search columns arrived that way and had to be reconciled after the fact by
`0003_reconcile_pushed_schema`. Never push to production or any shared database. Locally it is
only for throwaway experiments, and its target is whatever `POSTGRES_DATABASE_URL` or
`DATABASE_URL` resolves to. Afterwards, reset the local database (below) before generating the real
migration.

### Breaking changes

Use three steps so the deployed app and the database never disagree:

1. **Expand:** add the new column or table alongside the old one, and backfill it in the migration.
2. **Switch:** change the app to read and write the new shape; deploy.
3. **Contract:** drop the old column in a later migration.

### Rolling back

drizzle-kit has no down migrations. Roll a schema change back with a new forward migration that
undoes it. Locally, you can also reset the database.

## Resetting the local database

These commands target the repository's Compose `db` service, not an application connection URL.
Before any reset, inspect `docker compose config` and `docker compose ps db` to confirm the
project, container, and volume belong to this work; checkouts with the same Compose project name
can share them. Get explicit approval before replacing populated data. The resets are
**destructive**: local content, Profiles, and experiments not in the replacement are lost.

**Normal reset:** `pnpm db:pull`. It drops and recreates the `local` database inside the
container, restores a fresh production copy, baselines and applies migrations, and re-grants the
Local Developer admin role. It asks before replacing data (`--yes` to skip the question when not
running in a terminal).

**Back up first** if you might want the current contents. `db_exports/` is gitignored:

```sh
mkdir -p db_exports
docker compose exec -T db pg_dump -U root -d local --format=custom --no-owner --no-privileges \
	--schema=public --schema=drizzle > db_exports/local-backup.dump
```

To restore it, empty the local database with the manual reset below, then load it the same way
`pnpm preheat` loads a production copy (the dump recreates `public` itself):

```sh
docker compose exec -T db psql -U root -d local -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE'
docker compose exec -T db pg_restore -U root -d local --no-owner --no-privileges --exit-on-error \
	< db_exports/local-backup.dump
```

The backup holds whatever the local database held, including any copied production data; keep
it in `db_exports/` and delete it when you're done.

**Manual empty reset**, if you need the database empty rather than refilled. Run from the repo
root, and first check that `docker compose ps db` lists this checkout's container. These commands
run inside the container against its own server, with no connection URL, so no environment
variable can redirect them anywhere else:

```sh
# DESTRUCTIVE: deletes every table, row, and migration record in the local database.
docker compose exec -T db dropdb -U root --if-exists --force local
docker compose exec -T db createdb -U root local
```

`createdb` gives a clean database owned by `root` (the user the app connects as), with Postgres's
default `public` schema, so no ownership or grant fixes are needed. Dropping only the `public`
schema is not a reset: it leaves `drizzle.__drizzle_migrations` behind, so `drizzle-kit migrate`
would then skip every migration. The migrations can't build the schema from nothing either (see
[ADR-0001](./adr/0001-drizzle-postgres-over-prisma-mysql.md)), so to get a working database again,
restore a backup as above or run `pnpm preheat`, which fills an empty database from production.

**Full wipe**, including the Docker volume:

```sh
# DESTRUCTIVE: removes the Compose project's containers and non-external volumes.
# Confirm every affected resource belongs to this work; never wipe a shared project.
docker compose down --volumes
```

The next `pnpm preheat` creates a new volume and copies production again.

Never run `psql "$SOME_URL" -c 'DROP SCHEMA …'` or reset scripts that take their target from
`POSTGRES_DATABASE_URL` or `DATABASE_URL`: an inherited or leftover value can point them at a
remote database. `scripts/reset-pg-schema.js` is one of those (it also tells you to run a
`db:pg:push` that no longer exists); don't use it.

## Legacy MySQL reconciliation

`scripts/direct-db-migration.js` (`pnpm db:migrate:direct`) copies data from the old MySQL
database into Postgres. It reads its source from `MYSQL_DATABASE_URL` and its target from
`POSTGRES_DATABASE_URL`, and its default `--mode=refresh` **empties the target tables first**;
`--mode=insert-missing` only adds missing rows. Set both variables for that one command in your
shell, never in `.env.local` (where `POSTGRES_DATABASE_URL` would also redirect the app). The
procedure is in [`archive/postgres-migration-guide.md`](./archive/postgres-migration-guide.md).

## Checklist

- [ ] `schema.ts` and the generated migration agree, and the SQL is reviewed
- [ ] Applied locally with `pnpm preheat`; app and checks pass
- [ ] Breaking changes follow expand → switch → contract
- [ ] Migration SQL, snapshot, and journal committed together
- [ ] `schema-changelog.md` entry written, including the production order relative to deploy
