# Schema Changelog

This file tracks all schema changes made during and after the PostgreSQL migration.

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
- `POSTGRES_MIGRATION_GUIDE.md` - Complete migration guide
- `SCHEMA_DECISION.md` - Key pragmatic decisions

### Deployment Notes
- MySQL remains primary during transition period
- PostgreSQL synced daily/weekly using migration script
- No application code changes required yet

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
