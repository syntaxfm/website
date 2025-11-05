#!/usr/bin/env node
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';
import postgres from 'postgres';

expand(dotenv.config());

const MYSQL_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

const TABLES = [
	{ mysql: 'User', pg: 'users' },
	{ mysql: 'Role', pg: 'roles' },
	{ mysql: 'Session', pg: 'sessions' },
	{ mysql: 'Show', pg: 'shows' },
	{ mysql: 'Guest', pg: 'guests' },
	{ mysql: 'Transcript', pg: 'transcripts' },
	{ mysql: 'TranscriptUtterance', pg: 'transcript_utterances' },
	{ mysql: 'TranscriptUtteranceWord', pg: 'transcript_utterance_words' },
	{ mysql: 'Video', pg: 'videos' },
	{ mysql: 'Playlist', pg: 'playlists' },
	{ mysql: 'AiShowNote', pg: 'ai_show_notes' },
	{ mysql: 'SocialLink', pg: 'social_links' }
];

async function verifyMigration() {
	const mysqlConn = await createConnection({
		uri: MYSQL_URL,
		ssl: { rejectUnauthorized: false }
	});

	const pgClient = postgres(POSTGRES_URL, {
		max: 1,
		ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
	});

	try {
		console.log('🔍 Verifying migration...\n');

		let allMatch = true;

		for (const table of TABLES) {
			const [mysqlCount] = await mysqlConn.query(
				`SELECT COUNT(*) as count FROM \`${table.mysql}\``
			);
			const pgCount = await pgClient`SELECT COUNT(*) as count FROM ${pgClient(table.pg)}`;

			const mysqlRows = mysqlCount[0].count;
			const pgRows = parseInt(pgCount[0].count);

			const status = mysqlRows === pgRows ? '✅' : '⚠️';
			const match = mysqlRows === pgRows;

			if (!match) allMatch = false;

			console.log(
				`${status} ${table.mysql.padEnd(25)} MySQL: ${String(mysqlRows).padStart(7)} | PostgreSQL: ${String(pgRows).padStart(7)} ${!match ? '❌ MISMATCH' : ''}`
			);
		}

		if (allMatch) {
			console.log('\n✨ All tables match! Migration successful! 🎉');
			console.log(
				'\n👉 Next steps:\n   1. Update your code to use PostgreSQL Drizzle client\n   2. Test your application thoroughly\n   3. Keep MySQL as backup until confident'
			);
		} else {
			console.log(
				'\n⚠️  Some tables have mismatches. This may be due to:\n   - Orphaned data in MySQL (expected for SocialLink)\n   - Failed migrations\n   - Data integrity issues'
			);
		}
	} finally {
		await mysqlConn.end();
		await pgClient.end();
	}
}

verifyMigration().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
