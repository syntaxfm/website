# Migration Guide: V2 (Prisma) to V3 (Drizzle)

This document outlines the steps needed to migrate the production database from Prisma to Drizzle when deploying V3.

## TL;DR - It's Automatic! 🎉

The migration is **fully automated** in the `preheat.js` script. When you deploy V3 to production:

1. The preheat script runs automatically
2. It checks if `__drizzle_migrations` table exists
3. If not, it creates it and marks the initial migration as applied
4. Everything just works!

**You don't need to do anything manually.** The same script handles both local dev and production.

## What Happens Automatically

The `scripts/preheat.js` script now includes `ensureDrizzleMigrationSetup()` which:

1. **Checks for `__drizzle_migrations` table**
   - Creates it if it doesn't exist
   
2. **Marks initial migration as applied**
   - Checks if `0000_graceful_shaman` is already recorded
   - If not, adds it to prevent Drizzle from recreating existing tables
   
3. **Safe to run multiple times**
   - Won't create duplicates
   - Won't break if already set up

## Deployment Process

### Local Development
Just run `pnpm dev` as usual - the migration setup happens automatically.

### Production Deployment
1. Deploy V3 to production (Vercel/your hosting platform)
2. The preheat script runs during build/startup
3. Migration setup happens automatically
4. ✅ Done!

## Manual Setup (If Needed)

If for some reason you need to run the migration setup manually (e.g., in a database management UI):

```sql
-- Create Drizzle's migration tracking table
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  `id` SERIAL PRIMARY KEY,
  `hash` text NOT NULL,
  `created_at` bigint
);

-- Mark initial migration as applied
INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT '0000_graceful_shaman', UNIX_TIMESTAMP() * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM `__drizzle_migrations` WHERE `hash` = '0000_graceful_shaman'
);
```

## Future Schema Changes

After migration, use this workflow for schema changes:

1. **Make changes** in `src/server/db/schema.ts`
2. **Generate migration**: `pnpm drizzle-kit generate`
3. **Test locally**: `pnpm drizzle-kit migrate`
4. **Commit migration files**: `git add drizzle/` and commit
5. **Deploy to production**: Migrations run automatically via preheat script

## Verification

After deployment, check the logs for:

```
✅ Drizzle migrations
```

Or if it's the first run:

```
🔧 Setting up Drizzle migrations...
✅ Created __drizzle_migrations table
🔧 Marking initial migration as applied (Prisma → Drizzle transition)...
✅ Initial migration marked as applied
```

## Rollback Plan

If something goes wrong:

1. Revert deployment to V2
2. The database will still work with Prisma (we only added the `__drizzle_migrations` table)
3. Investigate issues before attempting migration again

## Important Notes

- **No manual intervention required** ✨
- **Safe for production** - The script checks before creating/inserting
- **No data loss** - Only adds tracking table, doesn't modify existing tables
- **Works everywhere** - Local dev, staging, production all use the same script

## What Changed

- **ORM**: Prisma → Drizzle
- **Migration tool**: `prisma migrate` → `drizzle-kit migrate`
- **Schema location**: `prisma/schema.prisma` → `src/server/db/schema.ts`
- **Type inference**: `@prisma/client` types → `src/server/db/types.ts`
- **Migration tracking**: Automatic via `preheat.js`

## Questions?

If you have questions or run into issues, refer to:
- [Drizzle Documentation](https://orm.drizzle.team/)
- `scripts/preheat.js` - Contains the automatic migration setup
- `scripts/prisma_to_drizzle.sql` - Manual SQL if needed
- This repository's git history for the full migration changes
