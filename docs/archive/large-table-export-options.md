# Large Table Export Options

> **Archived and partly superseded. Not a current procedure.** Written during the MySQL →
> Postgres move. Lines marked `# removed:` name scripts and commands that no longer exist
> (`pnpm db:export`, `pnpm db:pg:push`, `scripts/export-parallel.js`,
> `scripts/export-large-table-fast.js`). What still exists is `scripts/direct-db-migration.js`,
> which now reads its source from `MYSQL_DATABASE_URL` and its target from
> `POSTGRES_DATABASE_URL`, skips `TranscriptUtteranceWord` unless given
> `--include-transcript-words`, and by default (`--mode=refresh`) **empties each target table
> before loading it**. Set both URLs for one command in your shell, never in `.env` or
> `.env.local`, and never point the target at production without a reviewed plan.
>
> Current references: [`schema-workflow.md`](../schema-workflow.md) for schema changes and local
> resets, the [README](../../README.md) for local setup. The speed trade-offs below remain
> accurate background.

TranscriptUtteranceWord is massive and takes forever to export. Here are your options, ranked by speed:

## 🚀 Option 1: Skip It Entirely (FASTEST - 0 seconds)

**Best if:** You can regenerate the data from transcripts

```bash
# Already the default!
# removed: pnpm db:export (see the banner at the top)
```

TranscriptUtteranceWord is automatically skipped. The transcript data (TranscriptUtterance) should be sufficient to regenerate word-level data if needed.

**Pros:**
- Instant
- No waiting
- Still get all important data

**Cons:**
- Lose word-level transcript data (can be regenerated)

---

## ⚡ Option 2: Direct Database Migration (FASTEST with data - ~10-30 min)

**Best if:** You have both databases accessible simultaneously

```bash
# Make script executable
chmod +x scripts/direct-db-migration.js

# Migrate specific table
node scripts/direct-db-migration.js TranscriptUtteranceWord

# Or migrate all large tables
node scripts/direct-db-migration.js TranscriptUtterance
node scripts/direct-db-migration.js TranscriptUtteranceWord
```

**Speed:** 5,000-10,000 rows/second (vs 500-1,000 with CSV)

**Pros:**
- No CSV files (saves disk space)
- Streams directly MySQL → PostgreSQL
- Fastest option with actual data transfer
- Shows progress and speed

**Cons:**
- Requires both databases running
- Needs `POSTGRES_DATABASE_URL` set

**Example:**
```bash
# Set up both databases
# removed: pnpm db:pg:push (see the banner at the top)

# Direct migration
node scripts/direct-db-migration.js TranscriptUtteranceWord

# Output:
# 📊 Total rows to migrate: 2,450,000
# Progress: 2,450,000/2,450,000 (100%) - 8,500 rows/sec
# ⏱️  Time: 288.2s
```

---

## 🔥 Option 3: Parallel Export (FAST - 2-4x faster than default)

**Best if:** You need CSV files but want speed

```bash
# Make script executable
# removed: scripts/export-parallel.js

# Export with 4 workers (default)
# removed: scripts/export-parallel.js TranscriptUtteranceWord

# Export with 8 workers (faster on good connections)
# removed: scripts/export-parallel.js TranscriptUtteranceWord 8
```

**Speed:** 2-4x faster than sequential export

**Pros:**
- Much faster than default export
- Still creates CSV files
- Shows progress per worker
- Automatic chunk merging

**Cons:**
- Creates temporary chunk files
- Uses more database connections
- Still slower than direct migration

**Example:**
```bash
# 4 parallel workers
# removed: scripts/export-parallel.js TranscriptUtteranceWord 4

# Output:
# 📦 Chunk size: 612,500 rows per worker
#    Worker 1: 612,500 rows ✅
#    Worker 2: 612,500 rows ✅
#    Worker 3: 612,500 rows ✅
#    Worker 4: 612,500 rows ✅
# 📦 Merging chunks...
```

---

## 💨 Option 4: MySQL Native Export (VERY FAST - if available)

**Best if:** You have FILE privilege and local MySQL access

```bash
# Make script executable
# removed: scripts/export-large-table-fast.js

# Export using MySQL native methods
# removed: scripts/export-large-table-fast.js TranscriptUtteranceWord
```

**Speed:** 10-100x faster than row-by-row

**Pros:**
- Uses MySQL's native `SELECT INTO OUTFILE`
- Bypasses application layer
- Extremely fast

**Cons:**
- Requires FILE privilege
- Requires local server access or secure_file_priv settings
- May not work on PlanetScale or managed databases

---

## 🐌 Option 5: Default Export with Resume (SLOW but reliable)

**Best if:** Other options don't work and you need the data

```bash
# Export normally (will take hours)
SKIP_TABLES="" pnpm db:export

# If it gets interrupted, resume
RESUME_EXPORT=true SKIP_TABLES="" pnpm db:export
```

**Speed:** 500-1,000 rows/second

**Pros:**
- Works everywhere
- Resumable if interrupted
- Reliable

**Cons:**
- Very slow for millions of rows
- Can take hours or even days

---

## 📊 Speed Comparison

For a table with 2.5 million rows:

| Method | Time | Speed |
|--------|------|-------|
| Skip entirely | 0s | ∞ |
| Direct migration | ~5-10 min | ⚡⚡⚡⚡⚡ |
| Parallel (8 workers) | ~15-30 min | ⚡⚡⚡⚡ |
| Parallel (4 workers) | ~30-45 min | ⚡⚡⚡ |
| MySQL native | ~5-15 min* | ⚡⚡⚡⚡⚡ |
| Default export | ~2-6 hours | ⚡ |

*If available (often not on managed databases)

---

## 🎯 Recommended Approach

### For Most Users:
```bash
# 1. Skip TranscriptUtteranceWord initially
# removed: pnpm db:export (see the banner at the top)

# 2. Set up PostgreSQL
# removed: pnpm db:pg:push (see the banner at the top)

# 3. Import everything else from CSV
# ... import CSVs ...

# 4. Migrate just the large table directly
node scripts/direct-db-migration.js TranscriptUtteranceWord
```

### If You Need CSV Files:
```bash
# Use parallel export
# removed: scripts/export-parallel.js TranscriptUtteranceWord 8
```

### If Direct Migration Doesn't Work:
```bash
# Use parallel export then import
# removed: scripts/export-parallel.js TranscriptUtteranceWord 4

# Then import to PostgreSQL
\COPY transcript_utterance_words FROM 'db_exports/TranscriptUtteranceWord.csv' ...
```

---

## 🔧 Configuration

### For Direct Migration:

Historically this went in `.env` with the source as `PROD_DATABASE_URL`. Today the script reads
`MYSQL_DATABASE_URL` (source) and `POSTGRES_DATABASE_URL` (target), `PROD_DATABASE_URL` must be
the production Postgres URL used by `pnpm preheat`, and a persisted `POSTGRES_DATABASE_URL`
would redirect the app. Set both for the one command instead:

```bash
MYSQL_DATABASE_URL="mysql://..." POSTGRES_DATABASE_URL="postgresql://..." \
	node scripts/direct-db-migration.js --mode=insert-missing
```

### For Parallel Export:

Adjust workers based on your database connection limits:
- **PlanetScale:** 2-4 workers (connection limits)
- **AWS RDS:** 4-8 workers (more connections available)
- **Local MySQL:** 8-16 workers (no limits)

---

## ❓ FAQ

### Q: Do I need TranscriptUtteranceWord at all?

Probably not! It's word-level timing data that can be regenerated from TranscriptUtterance if needed. Skipping it is usually fine.

### Q: Which method should I use?

1. Try **Direct Migration** first (fastest with data)
2. Fall back to **Parallel Export** if direct doesn't work
3. Use **Default with Resume** as last resort

### Q: Can I run the migration multiple times?

Yes! All methods are repeatable. Direct migration automatically truncates the target table first.

### Q: What if it fails halfway through?

- **Direct Migration**: Automatically clears target table, safe to retry
- **Parallel Export**: May leave chunk files, clean up manually
- **Default Export**: Use `RESUME_EXPORT=true` to continue

### Q: How much disk space do I need?

- **CSV Export**: ~2-3x the table size (temporary chunks + final file)
- **Direct Migration**: None (streams directly)

Estimate: TranscriptUtteranceWord with 2.5M rows ≈ 500MB-1GB CSV file

---

## 🎉 Quick Start

Don't want to read all this? Here's the fastest path:

```bash
# 1. Export everything except huge tables
# removed: pnpm db:export (see the banner at the top)

# 2. Set up PostgreSQL
# removed: pnpm db:pg:push (see the banner at the top)

# 3. Import CSVs (all the small/medium tables)

# 4. Migrate the huge table directly
node scripts/direct-db-migration.js TranscriptUtteranceWord
```

Done! 🚀
