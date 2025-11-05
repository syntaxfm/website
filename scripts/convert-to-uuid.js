#!/usr/bin/env node
/**
 * Convert text/varchar columns to UUID type in PostgreSQL
 * Run this BEFORE pnpm db:pg:push if you have existing data
 */
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import postgres from 'postgres';

expand(dotenv.config());

const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

if (!POSTGRES_URL) {
	console.error('❌ ERROR: POSTGRES_DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
	max: 1,
	ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
});

async function convertToUUID() {
	console.log('🔄 Converting text columns to UUID type...\n');

	try {
		// Check if tables exist
		const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('shows', 'videos', 'playlists')
    `;

		if (tables.length === 0) {
			console.log('✅ No existing tables found - you can safely run pnpm db:pg:push\n');
			await sql.end();
			return;
		}

		console.log('📋 Found existing tables, converting to UUID...\n');

		// Step 1: Drop foreign key constraints
		console.log('🔓 Dropping foreign key constraints...');
		await sql`ALTER TABLE show_to_user DROP CONSTRAINT IF EXISTS show_to_user_show_id_shows_id_fk`;
		await sql`ALTER TABLE show_guests DROP CONSTRAINT IF EXISTS show_guests_show_id_shows_id_fk`;
		await sql`ALTER TABLE show_videos DROP CONSTRAINT IF EXISTS show_videos_show_id_shows_id_fk`;
		await sql`ALTER TABLE show_videos DROP CONSTRAINT IF EXISTS show_videos_video_id_videos_id_fk`;
		await sql`ALTER TABLE playlist_videos DROP CONSTRAINT IF EXISTS playlist_videos_playlist_id_playlists_id_fk`;
		await sql`ALTER TABLE playlist_videos DROP CONSTRAINT IF EXISTS playlist_videos_video_id_videos_id_fk`;

		// Step 2: Convert all columns to UUID
		console.log('\n🔄 Converting columns to UUID type...\n');

		// Shows-related conversions
		if (tables.find((t) => t.table_name === 'shows')) {
			console.log('  shows.id → uuid');
			await sql`ALTER TABLE shows ALTER COLUMN id TYPE uuid USING id::uuid`;

			console.log('  show_to_user.show_id → uuid');
			await sql`ALTER TABLE show_to_user ALTER COLUMN show_id TYPE uuid USING show_id::uuid`;

			console.log('  show_guests.show_id → uuid');
			await sql`ALTER TABLE show_guests ALTER COLUMN show_id TYPE uuid USING show_id::uuid`;

			console.log('  show_videos.show_id → uuid');
			await sql`ALTER TABLE show_videos ALTER COLUMN show_id TYPE uuid USING show_id::uuid`;
		}

		// Videos-related conversions
		if (tables.find((t) => t.table_name === 'videos')) {
			console.log('  videos.id → uuid');
			await sql`ALTER TABLE videos ALTER COLUMN id TYPE uuid USING id::uuid`;

			console.log('  show_videos.video_id → uuid');
			await sql`ALTER TABLE show_videos ALTER COLUMN video_id TYPE uuid USING video_id::uuid`;

			console.log('  playlist_videos.video_id → uuid');
			await sql`ALTER TABLE playlist_videos ALTER COLUMN video_id TYPE uuid USING video_id::uuid`;
		}

		// Playlists-related conversions
		if (tables.find((t) => t.table_name === 'playlists')) {
			console.log('  playlists.id → uuid');
			await sql`ALTER TABLE playlists ALTER COLUMN id TYPE uuid USING id::uuid`;

			console.log('  playlist_videos.playlist_id → uuid');
			await sql`ALTER TABLE playlist_videos ALTER COLUMN playlist_id TYPE uuid USING playlist_id::uuid`;
		}

		// Step 3: Re-add foreign key constraints
		console.log('\n🔒 Re-adding foreign key constraints...');
		await sql`ALTER TABLE show_to_user
      ADD CONSTRAINT show_to_user_show_id_shows_id_fk
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE`;

		await sql`ALTER TABLE show_guests
      ADD CONSTRAINT show_guests_show_id_shows_id_fk
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE`;

		await sql`ALTER TABLE show_videos
      ADD CONSTRAINT show_videos_show_id_shows_id_fk
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE`;

		await sql`ALTER TABLE show_videos
      ADD CONSTRAINT show_videos_video_id_videos_id_fk
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE`;

		await sql`ALTER TABLE playlist_videos
      ADD CONSTRAINT playlist_videos_playlist_id_playlists_id_fk
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE`;

		await sql`ALTER TABLE playlist_videos
      ADD CONSTRAINT playlist_videos_video_id_videos_id_fk
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE`;

		console.log('\n✅ UUID conversion complete!');
		console.log('➡️  You can now run: pnpm db:pg:push\n');
	} catch (error) {
		console.error('\n❌ Conversion failed:', error.message);
		if (error.code === '42P01') {
			console.log('\nℹ️  Some tables may not exist yet. This is okay if it\'s a fresh database.');
			console.log('   You can safely run: pnpm db:pg:push\n');
		} else {
			throw error;
		}
	} finally {
		await sql.end();
	}
}

convertToUUID().catch((error) => {
	console.error('❌ Error:', error);
	process.exit(1);
});
