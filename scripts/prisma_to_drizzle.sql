-- ============================================================================
-- Prisma to Drizzle Migration Transition Script
-- ============================================================================
-- This script should be run ONCE on each database (local, staging, prod)
-- when transitioning from Prisma to Drizzle migrations.
--
-- What this does:
-- 1. Creates the Drizzle migrations tracking table if it doesn't exist
-- 2. Marks the initial database introspection (0000_graceful_shaman) as already applied
--    since all tables already exist from Prisma
--
-- After running this:
-- - All future Drizzle migrations will run normally
-- - You can safely use `drizzle-kit migrate` going forward
-- ============================================================================

-- Create Drizzle's migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  `id` SERIAL PRIMARY KEY,
  `hash` text NOT NULL,
  `created_at` bigint
);

-- Mark the initial introspection as already applied
-- This prevents Drizzle from trying to create tables that already exist
INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT '0000_graceful_shaman', UNIX_TIMESTAMP() * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM `__drizzle_migrations` WHERE `hash` = '0000_graceful_shaman'
);

-- Verify the migration was recorded
SELECT * FROM `__drizzle_migrations`;
