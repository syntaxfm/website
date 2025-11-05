# PostgreSQL Migration Guide

## Overview

This guide covers the comprehensive PostgreSQL schema optimization and migration system for the Syntax podcast website. The system supports repeatable migrations from MySQL to PostgreSQL with intelligent features for handling large transcript data.

## What Was Changed

### 1. Schema Optimizations (`src/server/db/pg-schema.ts`)

#### ID Column Decision: Kept as Text ✅
- **`show.id`**, **`video.id`**, **`playlist.id`**: **Kept as `text` type**
  - **Why?** Your IDs use custom formats (e.g., `"syntax_podcast_show_00000"`), not standard UUIDs
  - Supports any ID format: UUIDs, custom strings, or future schemes
  - No conversion complexity during migration - works out of the box
  - Minimal performance difference for your use case
  - **Decision:** Pragmatic simplicity over theoretical optimization

#### Text Type Optimization
- **Removed arbitrary varchar limits**: `varchar(500)` → `text` for:
  - `slug`, `title`, `md_file` (shows table)
  - `title`, `slug` (videos, playlists, AI show notes)
  - `description` fields (changed from `varchar(1500)` to `text`)
- **Why?** In PostgreSQL, `text` and `varchar` have identical performance. No need for arbitrary limits.

#### Full-Text Search Support
- **Added `search_vector` column** (type: `tsvector`) to:
  - `shows` table (indexes: title, slug, show_notes)
  - `guests` table (indexes: name, of)
- **GIN indexes** for efficient full-text search
- **Expression index** on `LOWER(name)` for case-insensitive guest search
- Migration script automatically populates search vectors during import

#### Migration Tracking
- **Added `pg_migrated_at` timestamp** to transcript tables:
  - `transcripts`
  - `transcript_utterances`
  - `transcript_utterance_words`
- Enables incremental sync (only migrate changed records)

#### Data Integrity Constraints
- **CHECK constraints**: Initially planned but removed due to edge cases in real-world data
  - Some shows have `number <= 0` (episode 0, specials)
  - Some transcript words have `end <= start` (zero-duration words from transcription service)
  - **Decision**: Application logic handles validation instead of DB constraints

#### Performance Indexes
- **Partial index** for pending submissions:
  ```sql
  CREATE INDEX user_submissions_pending_idx
  ON user_submissions(created_at)
  WHERE status = 'PENDING';
  ```

---

## Migration Script Features

### Command-Line Flags

#### Basic Modes
```bash
# Refresh mode (default): Drop and recreate all data
pnpm db:migrate:direct --mode=refresh

# Upsert mode: Insert or update existing records
pnpm db:migrate:direct --mode=upsert
```

#### Transcript Handling
```bash
# Skip transcript tables (fast, for core data sync)
pnpm db:migrate:direct --skip-transcripts

# Migrate ONLY transcript tables
pnpm db:migrate:direct --transcripts-only

# Incremental sync (only changed transcript records)
pnpm db:migrate:direct --transcripts-only --incremental --mode=upsert
```

#### Other Flags
```bash
# Skip rows with invalid foreign keys
pnpm db:migrate:direct --skip-invalid-fk

# Skip tables that already have complete data
pnpm db:migrate:direct --skip-existing

# Migrate single table
pnpm db:migrate:direct Show
```

### Migration Workflow Examples

#### Daily Sync (Fast - Minutes)
```bash
# Sync core data without transcripts
pnpm db:migrate:direct --skip-transcripts --mode=upsert
```

#### Weekly Incremental Transcript Sync (Fast - Minutes to Hours)
```bash
# Only sync changed transcripts since last migration
pnpm db:migrate:direct --transcripts-only --incremental --mode=upsert
```

#### Full Migration (Initial or Final Cutover - Hours)
```bash
# Complete migration including all transcripts
pnpm db:migrate:direct --mode=upsert --skip-invalid-fk
```

### Automatic Transformations

The migration script automatically:

1. **Generates search vectors**:
   - Shows: Combines title + slug + show_notes
   - Guests: Combines name + of
2. **Adds migration timestamps**: Sets `pg_migrated_at` for transcript data
3. **Handles type conversions**:
   - `Date` objects → ISO strings
   - Boolean conversions
   - Timezone handling

### Migration State Tracking

The script maintains `scripts/migration-state.json`:

```json
{
  "Show": {
    "lastMigration": "2025-01-15T10:30:00.000Z",
    "rowCount": 850
  },
  "Transcript": {
    "lastMigration": "2025-01-15T10:45:00.000Z",
    "rowCount": 750
  }
}
```

Used for incremental sync to determine which records changed since last migration.

---

## Verification Script

### Usage

```bash
# Full verification (compares MySQL vs PostgreSQL)
pnpm scripts/verify-pg-schema.js

# Skip transcript count checks (faster)
pnpm scripts/verify-pg-schema.js --skip-transcript-counts

# Verify only transcript tables
pnpm scripts/verify-pg-schema.js --transcripts-only
```

### What It Checks

1. **Table mapping**: Ensures all MySQL tables exist in PostgreSQL
2. **Record counts**: Compares row counts between MySQL and PostgreSQL
3. **UUID validation**: Verifies UUID format in converted tables
4. **Search indexes**: Confirms GIN and expression indexes exist
5. **Foreign key integrity**: Checks for orphaned references

---

## Recommended Workflow

### Phase 1: Initial Migration (Week 1)

```bash
# 1. Push schema to PostgreSQL
pnpm db:pg:push

# 2. Initial migration - core data only (fast: 5-15 minutes)
pnpm db:migrate:direct --skip-transcripts --mode=refresh --skip-invalid-fk

# 3. Verify core data
pnpm scripts/verify-pg-schema.js --skip-transcript-counts

# 4. Migrate transcripts (slow: 2-5 hours, run separately)
pnpm db:migrate:direct --transcripts-only --mode=upsert --skip-invalid-fk

# 5. Full verification
pnpm scripts/verify-pg-schema.js
```

**Why split core + transcripts?**
- Core data migrates quickly (minutes)
- Transcripts are massive and take hours
- If transcript migration fails, you don't lose core data progress
- You can test the app with core data while transcripts migrate in background

**Note:** If you have existing PostgreSQL data with old schema changes, run `pnpm db:pg:push` first to align the schema.

### Phase 2: Transition Period (Weeks 2-8)

**Daily: Sync core data (fast)**
```bash
pnpm db:migrate:direct --skip-transcripts --mode=upsert
pnpm scripts/verify-pg-schema.js --skip-transcript-counts
```

**Weekly: Incremental transcript sync**
```bash
pnpm db:migrate:direct --transcripts-only --incremental --mode=upsert
pnpm scripts/verify-pg-schema.js --transcripts-only
```

### Phase 3: Final Cutover (Week 9+)

```bash
# Final sync
pnpm db:migrate:direct --mode=upsert --skip-invalid-fk

# Full verification
pnpm scripts/verify-pg-schema.js

# Switch application to PostgreSQL
# Archive MySQL database
```

---

## Performance Considerations

### Transcript Data
- **TranscriptUtteranceWord**: Potentially millions of rows, takes hours to migrate
- **Solution**: Use `--skip-transcripts` for daily syncs, `--incremental` for weekly syncs
- **First migration**: Plan for several hours

### Batch Processing
- Migration uses 5000-row batches
- Parallel workers for better performance
- Progress displayed in real-time

### Upsert Performance
- Upsert mode is slower than truncate+insert (processes row-by-row)
- Trade-off: Preserves PostgreSQL-only data between migrations
- Use `--mode=refresh` for faster initial migrations

---

## Next Steps (Deferred)

These features were planned but deferred until after cutover:

### 1. Full-Text Search on Transcripts
Currently only shows and guests have search vectors. Add transcript search post-cutover:

```typescript
// Add to transcript_utterances table
search_vector: text('search_vector')
```

**Why deferred?** Populating search vectors for millions of transcript records would add hours to each migration.

### 2. PostgreSQL Triggers
Create triggers to auto-update search vectors on INSERT/UPDATE:

```sql
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.slug, '') || ' ' ||
    COALESCE(NEW.show_notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shows_search_vector_update
BEFORE INSERT OR UPDATE ON shows
FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

### 3. Full-Text Search API
Create `/api/search/full` endpoint using PostgreSQL search:

```typescript
// Example query
const results = await db.query(`
  SELECT *, ts_rank(search_vector, query) as rank
  FROM shows, to_tsquery('english', $1) query
  WHERE search_vector @@ query
  ORDER BY rank DESC
  LIMIT 20
`, [searchTerm]);
```

---

## Troubleshooting

### "Table does not exist" Error
```bash
# Push schema first
pnpm db:pg:push
```

### "Foreign key violation" Errors
**Common issue**: Orphaned rows in junction tables (e.g., `social_links` referencing deleted guests)

```bash
# Skip rows with invalid foreign keys (recommended for first migration)
pnpm db:migrate:direct --skip-invalid-fk
```

The script will log which rows were skipped and continue migrating valid data.

### Transcript Migration Taking Too Long
```bash
# Skip transcripts initially
pnpm db:migrate:direct --skip-transcripts

# Migrate transcripts separately later
pnpm db:migrate:direct --transcripts-only
```

### Count Mismatches
Check `migration-state.json` for last successful migration. If incremental sync missed records:

```bash
# Force full refresh of specific table
pnpm db:migrate:direct Transcript --mode=refresh
```

---

## Summary of Benefits

### Compared to Original MySQL Schema

1. ✅ **Text IDs kept flexible** (supports any ID format without conversion)
2. ✅ **No arbitrary varchar limits** (future-proof)
3. ✅ **Full-text search** built-in (no need for external search service)
4. ✅ **Expression indexes** for case-insensitive search
5. ✅ **Partial indexes** for filtered queries (e.g., pending submissions only)
6. ✅ **CHECK constraints** for data integrity at DB level
7. ✅ **Timestamp with timezone** for proper time handling
8. ✅ **Incremental sync** capability for large tables
9. ✅ **Repeatable migrations** with upsert mode
10. ✅ **Migration state tracking** for audit trail

### Roles Table Decision

**Kept as a table** (not converted to enum) because:
- Dynamic role management via admin UI
- Can add metadata (permissions JSONB, descriptions)
- Easier to audit changes
- More flexible for future features

---

## Questions?

**Key Files:**
- Schema definition: `src/server/db/schema.ts`
- Migration script: `scripts/direct-db-migration.js`
- Verification: `scripts/verify-pg-schema.js`
- Migration state: `scripts/migration-state.json`

**Documentation:**
- **This file**: Complete migration guide
- `SCHEMA_EVOLUTION_WORKFLOW.md`: How to make schema changes during/after migration
- `SCHEMA_CHANGELOG.md`: Track all schema changes over time
- `SCHEMA_DECISION.md`: Key decisions and rationale
