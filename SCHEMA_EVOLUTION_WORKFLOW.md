# Schema Evolution Workflow

This guide covers how to make schema changes during and after the MySQL → PostgreSQL transition.

## Current State

**Primary Database**: MySQL (production traffic)
**Secondary Database**: PostgreSQL (being synced, testing)
**Migration Tool**: `scripts/direct-db-migration.js` (repeatable MySQL → PostgreSQL sync)
**Schema Source of Truth**: `src/server/db/schema.ts` (PostgreSQL schema)

---

## During Transition Period (MySQL Primary)

While MySQL is still your production database, you need to maintain BOTH schemas in sync.

### Workflow for Schema Changes

#### Step 1: Plan the Change

**Ask yourself:**
- Is this an **additive change** (new table/column)? → Safe, easy rollback
- Is this a **breaking change** (rename/delete column)? → Needs careful planning
- Does this affect the migration script? → Update transformations

**Types of Changes:**

**Additive (Low Risk):**
- Adding new tables
- Adding new nullable columns
- Adding new indexes

**Breaking (High Risk):**
- Renaming columns
- Deleting columns
- Changing column types
- Changing NOT NULL constraints

---

#### Step 2: Update PostgreSQL Schema

**File**: `src/server/db/schema.ts`

```typescript
// Example: Adding a new column
export const show = pgTable('shows', {
  // ... existing columns

  // NEW: Add SEO metadata
  meta_description: text('meta_description'),
  meta_keywords: text('meta_keywords'),

  // NEW: Add view tracking
  view_count: integer('view_count').default(0),
});
```

**For breaking changes**, add temporary compatibility:
```typescript
// Example: Renaming a column (transition period)
export const show = pgTable('shows', {
  // OLD column (keep during transition)
  // show_notes: text('show_notes').notNull(),

  // NEW column (add first)
  content: text('content').notNull(),
});
```

---

#### Step 3: Push to Test PostgreSQL

```bash
# Test on local/staging PostgreSQL first
pnpm db:pg:push
```

**Verify:**
- Schema applies successfully
- No constraint violations
- Indexes created properly

---

#### Step 4: Update MySQL Schema

Since MySQL is still primary, you need to mirror the change:

**Option A: Using Prisma (if still using Prisma for MySQL)**
```bash
# Update prisma/schema.prisma
pnpm db:push  # Push to MySQL
```

**Option B: Manual SQL (if migrated away from Prisma)**
```sql
-- Apply equivalent change to MySQL
ALTER TABLE Show
  ADD COLUMN meta_description TEXT,
  ADD COLUMN meta_keywords TEXT,
  ADD COLUMN view_count INT DEFAULT 0;
```

---

#### Step 5: Update Migration Script Transformations

If the change affects how data is transformed during migration, update the script.

**File**: `scripts/direct-db-migration.js`

```javascript
// Add transformation for new columns
function addComputedColumns(row, tableName, pgRow) {
  // Existing transformations...

  if (tableName === 'Show') {
    pgRow.search_vector = generateSearchVector(row, ['title', 'slug', 'show_notes']);

    // NEW: Set default values for new columns during migration
    pgRow.view_count = pgRow.view_count || 0;
    pgRow.meta_description = pgRow.meta_description || null;
  }

  return pgRow;
}
```

**For column renames:**
```javascript
function transformRow(mysqlRow, tableName) {
  const pgRow = { ...mysqlRow };

  // Map old MySQL column name to new PostgreSQL column name
  if (tableName === 'Show') {
    if (mysqlRow.show_notes) {
      pgRow.content = mysqlRow.show_notes;
      delete pgRow.show_notes;
    }
  }

  return pgRow;
}
```

---

#### Step 6: Test Migration with New Schema

```bash
# Full test migration to verify script works with new schema
pnpm db:migrate:direct --skip-transcripts --mode=refresh --skip-invalid-fk

# Verify new columns migrated correctly
pnpm scripts/verify-pg-schema.js --skip-transcript-counts
```

**Check:**
- New columns populated correctly
- Transformations work
- No errors during migration

---

#### Step 7: Update Application Code

Only update app code AFTER both databases have the new schema:

```typescript
// src/routes/(site)/show/[show_number]/[slug]/+page.server.ts
export async function load({ params }) {
  const show = await db.query.show.findFirst({
    where: eq(show.number, Number(params.show_number))
  });

  // Now safe to use new columns
  return {
    show,
    metaDescription: show.meta_description || show.title
  };
}
```

---

#### Step 8: Document the Change

Add to your migration log:

**File**: `SCHEMA_CHANGELOG.md` (create this)

```markdown
## 2025-11-02 - Add SEO Metadata

**Type**: Additive
**Status**: ✅ Applied to both MySQL + PostgreSQL

### Changes
- Added `meta_description` (text, nullable) to shows
- Added `meta_keywords` (text, nullable) to shows
- Added `view_count` (integer, default 0) to shows

### Migration Script Changes
- Updated `addComputedColumns()` to set defaults for new columns

### Deployment Notes
- Backwards compatible (new columns nullable)
- No application code changes required immediately
```

---

### Breaking Changes Workflow

For breaking changes (renames, deletions), use a **3-phase approach**:

#### Phase 1: Add New Column (keep old)
```typescript
export const show = pgTable('shows', {
  show_notes: text('show_notes').notNull(), // OLD - keep
  content: text('content'),                  // NEW - add
});
```

**Migration script**: Copy data from old → new
```javascript
if (tableName === 'Show') {
  pgRow.content = mysqlRow.show_notes; // Copy to new column
}
```

#### Phase 2: Update Application Code
Update all app code to use `content` instead of `show_notes`

#### Phase 3: Remove Old Column (after cutover to PostgreSQL)
```typescript
export const show = pgTable('shows', {
  // show_notes: text('show_notes').notNull(), // REMOVED
  content: text('content').notNull(),
});
```

---

## After PostgreSQL Cutover (PostgreSQL Primary)

Once you've switched to PostgreSQL as primary, workflow simplifies:

### Standard Workflow

#### 1. Update Schema
```typescript
// src/server/db/schema.ts
export const newTable = pgTable('new_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});
```

#### 2. Generate Migration
```bash
pnpm db:pg:generate
```

This creates a migration file in `drizzle/migrations/`:
```sql
-- drizzle/migrations/0001_add_new_table.sql
CREATE TABLE "new_table" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL
);
```

#### 3. Review Migration
Check the generated SQL to ensure it's correct.

#### 4. Test Locally
```bash
pnpm db:pg:push  # Test on local PostgreSQL
```

#### 5. Apply to Staging
```bash
# On staging environment
pnpm db:pg:migrate
```

#### 6. Deploy to Production
```bash
# On production environment
pnpm db:pg:migrate

# Or use Drizzle Kit in CI/CD
npx drizzle-kit migrate
```

---

## Migration Script Maintenance

As your schema evolves, keep the migration script updated:

### When to Update the Script

**Add transformations when:**
- Adding computed columns (search vectors, defaults)
- Renaming columns (old → new mapping)
- Changing data types (conversion logic)
- Adding new tables (include in table list)

**Example**: Adding a new table
```javascript
// scripts/direct-db-migration.js

// Add to table order (respecting foreign keys)
const orderedTables = [
  'Role', 'User', 'Show', 'Guest',
  'NewTable', // <-- Add here in correct dependency order
  'Session', 'UserRole',
  // ...
];

// Add table mapping
const TABLE_NAME_MAP = {
  NewMySQLTable: 'new_table',  // MySQL -> PostgreSQL name mapping
};
```

---

## Testing Schema Changes

### Local Testing Checklist

Before applying any schema change to production:

- [ ] Schema applies to local PostgreSQL without errors
- [ ] Migration script runs successfully with new schema
- [ ] Verification script passes
- [ ] Application code works with new schema
- [ ] Existing queries still work (backwards compatibility)
- [ ] New queries use new schema correctly

### Testing Commands

```bash
# 1. Reset local PostgreSQL to clean state
psql "$POSTGRES_DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Push new schema
pnpm db:pg:push

# 3. Test migration
pnpm db:migrate:direct --skip-transcripts --mode=refresh --skip-invalid-fk

# 4. Verify
pnpm scripts/verify-pg-schema.js --skip-transcript-counts

# 5. Test application
pnpm dev
# Navigate to affected pages, test functionality
```

---

## Schema Version Control

### Recommended Git Workflow

```bash
# 1. Create feature branch for schema change
git checkout -b schema/add-seo-metadata

# 2. Make schema changes
# - Update src/server/db/schema.ts
# - Update scripts/direct-db-migration.js (if needed)
# - Update app code

# 3. Test thoroughly locally

# 4. Document change
# - Update SCHEMA_CHANGELOG.md
# - Update POSTGRES_MIGRATION_GUIDE.md (if workflow changes)

# 5. Commit with clear message
git add src/server/db/schema.ts scripts/direct-db-migration.js
git commit -m "schema: add SEO metadata fields to shows table

- Add meta_description, meta_keywords, view_count to shows
- Update migration script to set defaults
- Backwards compatible (nullable columns)"

# 6. Push and create PR
git push origin schema/add-seo-metadata
```

### Migration State Tracking

The migration script maintains state in `scripts/migration-state.json`:

```json
{
  "Show": {
    "lastMigration": "2025-11-02T10:30:00.000Z",
    "rowCount": 850,
    "schemaVersion": "1.2.0"  // Consider adding version tracking
  }
}
```

**Consider adding**: Schema version to track which version was last migrated.

---

## Common Scenarios

### Adding a New Table

1. ✅ Add to `schema.ts`
2. ✅ Add to `orderedTables` in migration script
3. ✅ Run `pnpm db:pg:push`
4. ✅ Test migration
5. ✅ Add to MySQL (during transition period)

### Adding a New Column

**Nullable column (safe):**
1. ✅ Add to `schema.ts` with `.nullable()` or default value
2. ✅ Run `pnpm db:pg:push`
3. ✅ Migration script handles automatically
4. ✅ Add to MySQL

**NOT NULL column (requires data):**
1. ✅ Add to `schema.ts` as nullable first
2. ✅ Update migration script to populate value
3. ✅ Test migration
4. ✅ Change to NOT NULL after data populated
5. ✅ Mirror in MySQL

### Renaming a Column

Use 3-phase approach:
1. **Phase 1**: Add new column, keep old → Update migration script to copy data
2. **Phase 2**: Update all app code to use new column
3. **Phase 3**: Remove old column (after PostgreSQL cutover)

### Deleting a Table

**During transition:**
1. ❌ **Don't delete** from MySQL (still primary)
2. ✅ Remove from PostgreSQL schema
3. ✅ Remove from migration script `orderedTables`
4. ✅ Update app code to not use table

**After cutover:**
1. ✅ Generate migration with `pnpm db:pg:generate`
2. ✅ Review DROP TABLE migration
3. ✅ Backup data if needed
4. ✅ Apply migration

---

## Rollback Strategy

### During Transition (MySQL Primary)

**Easy rollback**: Just point app back to MySQL
```bash
# In .env
DATABASE_URL="mysql://..."  # Switch back to MySQL
# POSTGRES_DATABASE_URL stays for background syncing
```

### After Cutover (PostgreSQL Primary)

**Database rollback**: Use Drizzle migrations
```bash
# Rollback last migration
pnpm db:pg:migrate --rollback

# Or restore from backup
pg_restore -d syntax_production backup.dump
```

**Application rollback**: Git revert + redeploy
```bash
git revert <commit-hash>
git push
# Trigger deployment
```

---

## Best Practices

### Do's ✅

- ✅ Test schema changes locally first
- ✅ Make additive changes when possible (new columns nullable)
- ✅ Document every schema change
- ✅ Keep migration script in sync with schema
- ✅ Use transactions for multi-step changes
- ✅ Backup before major changes
- ✅ Version your schema changes in git

### Don'ts ❌

- ❌ Don't make breaking changes without 3-phase approach
- ❌ Don't skip testing migrations after schema changes
- ❌ Don't apply production changes without staging test
- ❌ Don't forget to update BOTH databases during transition
- ❌ Don't change primary keys or unique constraints lightly
- ❌ Don't delete data without backups

---

## Quick Reference

### Transition Period Commands

```bash
# 1. Update PostgreSQL schema
pnpm db:pg:push

# 2. Update MySQL schema
pnpm db:push  # (or manual SQL)

# 3. Test migration with new schema
pnpm db:migrate:direct --skip-transcripts --mode=upsert --skip-invalid-fk

# 4. Verify
pnpm scripts/verify-pg-schema.js --skip-transcript-counts
```

### Post-Cutover Commands

```bash
# 1. Update schema
# Edit src/server/db/schema.ts

# 2. Generate migration
pnpm db:pg:generate

# 3. Apply to production
pnpm db:pg:migrate
```

---

## Next Steps

1. **Create** `SCHEMA_CHANGELOG.md` to track all schema changes
2. **Add schema version** to migration state tracking
3. **Set up staging environment** to test schema changes
4. **Document your specific tables** and their relationships for reference

Your schema evolution is now managed, repeatable, and safe! 🎉
