-- ============================================================================
-- PostgreSQL: Prepare schema for UUID conversion
-- ============================================================================
-- This script converts existing text/varchar columns to uuid type
-- Run this BEFORE running `pnpm db:pg:push`
--
-- Usage:
--   psql "$POSTGRES_DATABASE_URL" -f scripts/prepare-pg-for-uuid.sql
-- ============================================================================

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Convert show-related tables
ALTER TABLE "shows"
  ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

ALTER TABLE "show_to_user"
  ALTER COLUMN "show_id" TYPE uuid USING "show_id"::uuid;

ALTER TABLE "show_guests"
  ALTER COLUMN "show_id" TYPE uuid USING "show_id"::uuid;

ALTER TABLE "show_videos"
  ALTER COLUMN "show_id" TYPE uuid USING "show_id"::uuid;

-- Convert video-related tables
ALTER TABLE "videos"
  ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

ALTER TABLE "show_videos"
  ALTER COLUMN "video_id" TYPE uuid USING "video_id"::uuid;

ALTER TABLE "playlist_videos"
  ALTER COLUMN "video_id" TYPE uuid USING "video_id"::uuid;

-- Convert playlist-related tables
ALTER TABLE "playlists"
  ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

ALTER TABLE "playlist_videos"
  ALTER COLUMN "playlist_id" TYPE uuid USING "playlist_id"::uuid;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify conversions
SELECT 'shows' as table_name, COUNT(*) as uuid_count FROM shows WHERE id IS NOT NULL
UNION ALL
SELECT 'videos', COUNT(*) FROM videos WHERE id IS NOT NULL
UNION ALL
SELECT 'playlists', COUNT(*) FROM playlists WHERE id IS NOT NULL;

PRINT 'UUID conversions complete!';
