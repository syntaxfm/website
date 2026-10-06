# Schema Changelog

This file tracks all schema changes made during and after the PostgreSQL migration. How to make a
change: [`schema-workflow.md`](./schema-workflow.md).

Production is never migrated by local tooling, builds, or deploys. Each entry's **Deployment Notes**
say when a maintainer applies its migration to production relative to the app deploy. The
**Status** line records what was known when the entry was written; check production itself before
relying on it.

## Format

```markdown
## YYYY-MM-DD - Change Title

**Type**: Additive | Breaking | Index | Constraint
**Status**: ✅ Applied | 🚧 In Progress | ⏸️ Deferred
**Affects**: Table names

### Changes
- Description of changes

### Migration Script Changes
- Changes made to direct-db-migration.js (if any)

### Application Code Changes
- Files/features affected

### Rollback Plan
- How to undo if needed

### Deployment Notes
- Any special considerations
```

---

## 2026-09-23 - Reconcile pushed schema

**Type**: Constraint (history reconciliation)
**Status**: Migration committed; production state not recorded here
**Affects**: `articles`; migration snapshot for `content`, `articles`, `tags`, `content_tags`, `search_vector` columns and indexes

### Changes
- `0003_reconcile_pushed_schema`'s snapshot records the content model, search vectors, and indexes that reached production through `drizzle-kit push` without a migration.
- Its SQL only renames `articles_author_id_users_id_fk` to `articles_author_id_profiles_id_fk`, the one difference a post-0002 database still had.

### Migration Script Changes
- `direct-db-migration.js` gained `--mode=insert-missing` and reads `MYSQL_DATABASE_URL` / `POSTGRES_DATABASE_URL` explicitly.

### Rollback Plan
- Rename the constraint back. The snapshot change has no database effect.

### Deployment Notes
- Applies after `0002_syntax_auth`. Local copies get it from `pnpm preheat` / `pnpm db:pull`.
- Don't use `drizzle-kit push` on shared databases again; see [`schema-workflow.md`](./schema-workflow.md).

---

## 2026-07-24 - Central Syntax Auth profile split

**Type**: Breaking
**Status**: Pending deployment
**Affects**: `users`, `user_roles`, `show_to_user`, `sessions`

### Changes
- Renamed the local editorial `users` table to `profiles` and added a unique nullable `central_user_id` mapping.
- Renamed role and Show Host joins to profile terminology while preserving existing UUID relationships.
- Removed the app-local `sessions` table; central Better Auth is the only session authority.
- Backfilled the currently available central identity by audited GitHub account ID.

### Application Code Changes
- Authentication now forwards the shared cookie to `auth.syntax.fm` and resolves app roles through the Profile mapping.
- Local GitHub OAuth, callback, access-token cookie, and session code were removed.

### Rollback Plan
- Restore the previous application before applying this migration. After migration, table renames can be reversed, but deleted local sessions are intentionally not recoverable.

### Deployment Notes
- Apply `drizzle/pg-migrations/0002_syntax_auth.sql` before deploying the application.
- Map additional central User IDs to Profiles before those Users need website roles.

---

## 2025-11-02 - Initial PostgreSQL Schema

**Type**: Migration
**Status**: ✅ Applied
**Affects**: All tables

### Changes
- Migrated from MySQL to PostgreSQL-optimized schema
- Kept `show.id`, `video.id`, `playlist.id` as `text` (not UUID) to support custom ID formats
- Changed arbitrary `varchar` limits to `text` for flexibility
- Added `search_vector` columns to `shows` and `guests` for full-text search
- Added `pg_migrated_at` timestamps to transcript tables for incremental sync
- Added GIN indexes for full-text search
- Added expression index on `LOWER(guests.name)` for case-insensitive search
- Added partial index on `user_submissions` for pending status
- Removed CHECK constraints (edge cases in real data: episode 0, zero-duration words)

### Migration Script
- Created `scripts/direct-db-migration.js` for repeatable MySQL → PostgreSQL sync
- Supports flags: `--skip-transcripts`, `--transcripts-only`, `--incremental`, `--mode=upsert/refresh`
- Automatic search vector generation during migration
- State tracking in `scripts/migration-state.json`

### Files
- Schema: `src/server/db/schema.ts`
- Relations: `src/server/db/relations.ts`
- Client: `src/server/db/client.ts`
- Types: `src/server/db/types.ts`

### Documentation
- `docs/archive/postgres-migration-guide.md` — Complete migration guide (archived)
- [ADR-0002](./adr/0002-text-ids-not-uuids.md), [ADR-0003](./adr/0003-no-check-constraints.md) — Key pragmatic decisions

### Deployment Notes
- At the time: MySQL remained primary during the transition, and PostgreSQL was synced with the migration script. The cutover has since completed; Postgres is primary.
- Production's schema was built by the migration script, not by replaying migrations, so it has no migration history for `0000`/`0001`; see [ADR-0001](./adr/0001-drizzle-postgres-over-prisma-mysql.md).

---

## Template for Future Changes

## YYYY-MM-DD - Change Title

**Type**: Additive
**Status**: 🚧 In Progress
**Affects**: table_name

### Changes
-

### Migration Script Changes
-

### Application Code Changes
-

### Rollback Plan
-

### Deployment Notes
-

---

## Tips

- **Always add status emoji**: ✅ ✓ (applied), 🚧 (in progress), ⏸️ (deferred), ❌ (failed/reverted)
- **Link to PRs**: Add GitHub PR links for code review context
- **Note breaking changes**: Clearly mark anything that breaks backwards compatibility
- **Update regularly**: Don't let this get stale - update as you make changes
