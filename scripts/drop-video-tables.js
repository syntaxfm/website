#!/usr/bin/env node
import 'varlock/auto-load';
import postgres from 'postgres';

const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

if (!POSTGRES_URL) {
	console.error('❌ ERROR: POSTGRES_DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
	max: 1,
	ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
});

async function dropVideoTables() {
	try {
		console.log('🗑️  Dropping video-related tables...');

		await sql`DROP TABLE IF EXISTS show_videos CASCADE`;
		console.log('✅ Dropped show_videos');

		await sql`DROP TABLE IF EXISTS playlist_videos CASCADE`;
		console.log('✅ Dropped playlist_videos');

		await sql`DROP TABLE IF EXISTS videos CASCADE`;
		console.log('✅ Dropped videos');

		await sql`DROP TABLE IF EXISTS playlists CASCADE`;
		console.log('✅ Dropped playlists');

		console.log('\n✨ Video tables dropped!');
		console.log('👉 Run: pnpm db:pg:push to recreate with correct types\n');
	} catch (error) {
		console.error('❌ Error:', error.message);
		throw error;
	} finally {
		await sql.end();
	}
}

dropVideoTables().catch(() => process.exit(1));
