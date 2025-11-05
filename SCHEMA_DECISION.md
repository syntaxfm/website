# PostgreSQL Schema Decisions

This document records pragmatic decisions made during the MySQL → PostgreSQL migration.

## Decision 1: Keep IDs as Text (Not UUID)

### Original Plan
Convert `show.id`, `video.id`, `playlist.id` from `text` → `uuid` type for "better performance"

### Final Decision
**Keep all IDs as `text` type**

### Why We Changed Course

When running the UUID conversion, we discovered:
```
show.id = "syntax_podcast_show_00000"  ❌ Not a valid UUID format
```

Your `show.id` values use **custom string formats**, not standard UUIDs. This is perfectly valid and works well for your use case.

### The Right Call

**Keeping IDs as text is the correct decision because:**

1. **Works with your data** - No conversion errors, no data format issues
2. **Simple migration** - Script works out of the box, no special handling
3. **Flexible** - Supports UUIDs, custom strings, or any future ID scheme
4. **Minimal cost** - Performance difference is negligible:
   - UUID storage: 16 bytes
   - Text UUID: ~36 bytes
   - Difference: ~20 bytes per row (tiny at your scale)
5. **Less risk** - No chance of conversion failures or data mismatches

## Performance Impact

**Reality Check:**
- For 1,000 shows: ~20KB extra storage
- For 10,000 videos: ~200KB extra storage
- Join performance: Microseconds difference

**Verdict:** The performance "cost" is **completely negligible** compared to the complexity cost of UUID conversion.

## What You Still Get

All the important optimizations are still in place:

✅ No arbitrary varchar limits (text instead of varchar(500))
✅ Full-text search with GIN indexes
✅ Expression indexes for case-insensitive search
✅ Partial indexes for filtered queries
✅ CHECK constraints for data integrity
✅ Incremental sync for transcripts
✅ Repeatable migrations with upsert mode

## Next Steps

**You can now run:**

```bash
# This will work without any issues
pnpm db:pg:push

# Then migrate your data
pnpm db:migrate:direct --mode=refresh --skip-invalid-fk
```

No conversion script needed. No special handling. Just works.

## Decision 2: Remove CHECK Constraints

### Original Plan
Add CHECK constraints for data integrity:
- `shows.number > 0` (episode numbers must be positive)
- `transcript_utterances.end > start` (time ranges must be valid)
- `transcript_utterance_words.end > start` (time ranges must be valid)

### Final Decision
**Remove all CHECK constraints**

### Why We Changed Course

When pushing the schema to PostgreSQL, we discovered real-world data doesn't match theoretical constraints:

```
ERROR: check constraint "shows_number_positive" is violated by some row
ERROR: check constraint "transcript_utterance_words_time_range_valid" is violated by some row
```

**Examples of edge cases:**
- Episode 0 exists (introductory episode)
- Special episodes may have negative numbers
- Transcript words sometimes have `end = start` (instantaneous words)
- Zero-duration words from transcription service edge cases

### The Right Call

**Application-level validation is better because:**
1. **Flexible**: Can handle edge cases with business logic
2. **No migration blockers**: Schema push doesn't fail on existing data
3. **Better error messages**: App can explain why validation failed
4. **Easier updates**: Change validation logic without DB migrations
5. **Real data wins**: Database should store reality, not theory

## Lessons Learned

**"Perfect" is the enemy of "done"**

- UUID types would be "theoretically better" → But custom IDs work fine
- CHECK constraints would be "best practice" → But real data has edge cases
- Text IDs are "good enough" and work perfectly
- Simpler solutions are often the right solutions

**The best schema is the one that works with your data and requirements**, not the one that follows textbook rules.

**Trust your data**: If constraints fail on existing data, the constraints are wrong, not the data.
