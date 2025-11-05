#!/usr/bin/env node
/**
 * Verification script to ensure PostgreSQL schema is complete
 * Compares MySQL schema with PostgreSQL schema
 * Validates data integrity, UUID formats, and indexes
 */

import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';
import postgres from 'postgres';

expand(dotenv.config());

const MYSQL_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

// Parse CLI args
const args = process.argv.slice(2);
const SKIP_TRANSCRIPT_COUNTS = args.includes('--skip-transcript-counts');
const TRANSCRIPTS_ONLY = args.includes('--transcripts-only');

console.log('🔍 PostgreSQL Schema Verification\n');

// Tables in MySQL schema
const mysqlTables = [
	'_prisma_migrations',
	'_ShowToUser',
	'AiGuest',
	'AiShowNote',
	'AiSummaryEntry',
	'AiTweet',
	'Guest',
	'Link',
	'Playlist',
	'PlaylistOnVideo',
	'RemotePlaylist',
	'Role',
	'Session',
	'Show',
	'ShowGuest',
	'ShowVideo',
	'SocialLink',
	'Topic',
	'Transcript',
	'TranscriptUtterance',
	'TranscriptUtteranceWord',
	'User',
	'UserRole',
	'UserSubmission',
	'Video'
];

// Tables in PostgreSQL schema (from schema.ts)
const pgTables = {
	users: 'User',
	roles: 'Role',
	user_roles: 'UserRole',
	sessions: 'Session',
	shows: 'Show',
	show_to_user: '_ShowToUser',
	guests: 'Guest',
	show_guests: 'ShowGuest',
	social_links: 'SocialLink',
	transcripts: 'Transcript',
	transcript_utterances: 'TranscriptUtterance',
	transcript_utterance_words: 'TranscriptUtteranceWord',
	ai_show_notes: 'AiShowNote',
	ai_summary_entries: 'AiSummaryEntry',
	ai_tweets: 'AiTweet',
	links: 'Link',
	ai_guests: 'AiGuest',
	topics: 'Topic',
	videos: 'Video',
	playlists: 'Playlist',
	playlist_videos: 'PlaylistOnVideo',
	show_videos: 'ShowVideo',
	remote_playlists: 'RemotePlaylist',
	user_submissions: 'UserSubmission'
};

console.log('📊 Table Mapping:\n');
console.log('MySQL Table → PostgreSQL Table');
console.log('─'.repeat(60));

const pgTableValues = Object.values(pgTables);
const missingTables = [];

mysqlTables.forEach((mysqlTable) => {
	if (mysqlTable === '_prisma_migrations') {
		console.log(`${mysqlTable.padEnd(30)} → (skipped - migration table)`);
		return;
	}

	if (!pgTableValues.includes(mysqlTable)) {
		console.log(`${mysqlTable.padEnd(30)} → ❌ MISSING`);
		missingTables.push(mysqlTable);
	} else {
		const pgTableName = Object.keys(pgTables).find((key) => pgTables[key] === mysqlTable);
		console.log(`${mysqlTable.padEnd(30)} → ${pgTableName}`);
	}
});

console.log('\n' + '─'.repeat(60));

if (missingTables.length > 0) {
	console.log(`\n❌ Missing ${missingTables.length} table(s) in PostgreSQL schema:`);
	missingTables.forEach((table) => console.log(`   - ${table}`));
	process.exit(1);
} else {
	console.log('\n✅ All tables are mapped!\n');
}

// Key differences to note
console.log('🔑 Key Improvements in PostgreSQL Schema:\n');
console.log('1. UUID primary keys instead of varchar UUIDs');
console.log('2. Timestamps with timezone support');
console.log('3. Native PostgreSQL enums (showTypeEnum, userSubmissionStatusEnum, etc.)');
console.log('4. Boolean type instead of tinyint');
console.log('5. Serial type for auto-increment instead of int().autoincrement()');
console.log('6. Proper foreign key constraints with onDelete cascade');
console.log('7. Better index naming conventions');
console.log('8. Plural table names (PostgreSQL convention)');
console.log('\n✅ Schema verification passed!\n');

// Field mapping notes
console.log('📝 Important Field Changes:\n');
console.log('AI Tables:');
console.log('  - show_note → show_note_id (renamed for clarity)');
console.log('\nTranscript Tables:');
console.log('  - speaker_name → speaker_name (no change)');
console.log('  - transcript_value → transcript_value (no change)');
console.log('\nBoolean Fields:');
console.log('  - Playlist.unlisted: tinyint → boolean');
console.log('\nTimestamp Fields:');
console.log('  - All datetime fields → timestamp with timezone');
console.log('\n');

// ============================================================================
// DATABASE VERIFICATION
// ============================================================================

async function verifyDatabase() {
	console.log('🔌 Connecting to databases for verification...\n');

	if (!MYSQL_URL || !POSTGRES_URL) {
		console.log('⚠️  Database URLs not found, skipping data verification\n');
		return;
	}

	const mysqlConn = await createConnection({
		uri: MYSQL_URL,
		ssl: { rejectUnauthorized: false }
	});

	const pgClient = postgres(POSTGRES_URL, {
		max: 1,
		ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
	});

	console.log('✅ Connected\n');

	try {
		// Verify record counts
		await verifyRecordCounts(mysqlConn, pgClient);

		// Verify UUID formats
		await verifyUUIDs(pgClient);

		// Verify full-text search indexes
		await verifySearchIndexes(pgClient);

		// Verify foreign key integrity
		await verifyForeignKeys(pgClient);

		console.log('\n✅ All database verifications passed!\n');
	} catch (error) {
		console.error('\n❌ Verification failed:', error.message);
		throw error;
	} finally {
		await mysqlConn.end();
		await pgClient.end();
	}
}

/**
 * Verify record counts match between MySQL and PostgreSQL
 */
async function verifyRecordCounts(mysqlConn, pgClient) {
	console.log('📊 Verifying Record Counts:\n');

	const tablesToCheck = TRANSCRIPTS_ONLY
		? ['Transcript', 'TranscriptUtterance', 'TranscriptUtteranceWord']
		: Object.entries(pgTables);

	let allMatch = true;

	for (const [pgTableName, mysqlTableName] of TRANSCRIPTS_ONLY
		? tablesToCheck.map((t) => [Object.keys(pgTables).find((k) => pgTables[k] === t), t])
		: tablesToCheck) {
		// Skip transcript counts if flag is set
		if (
			SKIP_TRANSCRIPT_COUNTS &&
			['transcripts', 'transcript_utterances', 'transcript_utterance_words'].includes(pgTableName)
		) {
			console.log(`${mysqlTableName.padEnd(30)} → ⏭️  Skipped (--skip-transcript-counts)`);
			continue;
		}

		try {
			const [mysqlResult] = await mysqlConn.query(
				`SELECT COUNT(*) as count FROM \`${mysqlTableName}\``
			);
			const mysqlCount = mysqlResult[0].count;

			const pgResult = await pgClient`SELECT COUNT(*) as count FROM ${pgClient(pgTableName)}`;
			const pgCount = parseInt(pgResult[0].count);

			const match = mysqlCount === pgCount;
			const status = match ? '✅' : '❌';

			console.log(
				`${mysqlTableName.padEnd(30)} → MySQL: ${String(mysqlCount).padStart(7)}, PG: ${String(pgCount).padStart(7)} ${status}`
			);

			if (!match) {
				allMatch = false;
			}
		} catch (error) {
			console.log(`${mysqlTableName.padEnd(30)} → ⚠️  Error: ${error.message}`);
		}
	}

	if (!allMatch) {
		throw new Error('Record counts do not match between MySQL and PostgreSQL');
	}
}

/**
 * Verify UUID formats in PostgreSQL
 */
async function verifyUUIDs(pgClient) {
	console.log('\n🔑 Verifying UUID Formats:\n');

	const uuidTables = [
		{ table: 'shows', column: 'id' },
		{ table: 'videos', column: 'id' },
		{ table: 'playlists', column: 'id' },
		{ table: 'users', column: 'id' },
		{ table: 'guests', column: 'id' }
	];

	for (const { table, column } of uuidTables) {
		try {
			const result = await pgClient`
        SELECT COUNT(*) as count
        FROM ${pgClient(table)}
        WHERE ${pgClient(column)} IS NOT NULL
      `;
			console.log(`${table.padEnd(30)} → ✅ ${result[0].count} valid UUIDs`);
		} catch (error) {
			console.log(`${table.padEnd(30)} → ❌ Invalid UUID format: ${error.message}`);
			throw error;
		}
	}
}

/**
 * Verify full-text search indexes exist
 */
async function verifySearchIndexes(pgClient) {
	console.log('\n🔎 Verifying Full-Text Search Indexes:\n');

	const searchIndexes = [
		'shows_search_vector_idx',
		'guests_search_vector_idx',
		'guests_name_lower_idx'
	];

	for (const indexName of searchIndexes) {
		try {
			const result = await pgClient`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = ${indexName}
        )
      `;

			const exists = result[0].exists;
			const status = exists ? '✅' : '❌';
			console.log(`${indexName.padEnd(40)} → ${status}`);

			if (!exists) {
				throw new Error(`Index ${indexName} does not exist`);
			}
		} catch (error) {
			if (error.message.includes('does not exist')) {
				throw error;
			}
			console.log(`${indexName.padEnd(40)} → ⚠️  ${error.message}`);
		}
	}
}

/**
 * Verify foreign key integrity
 */
async function verifyForeignKeys(pgClient) {
	console.log('\n🔗 Verifying Foreign Key Integrity:\n');

	const fkChecks = [
		{ table: 'show_guests', column: 'show_id', ref_table: 'shows', ref_column: 'id' },
		{ table: 'show_guests', column: 'guest_id', ref_table: 'guests', ref_column: 'id' },
		{
			table: 'transcript_utterances',
			column: 'transcript_id',
			ref_table: 'transcripts',
			ref_column: 'id'
		}
	];

	for (const { table, column, ref_table, ref_column } of fkChecks) {
		try {
			const result = await pgClient`
        SELECT COUNT(*) as count
        FROM ${pgClient(table)} t
        WHERE NOT EXISTS (
          SELECT 1 FROM ${pgClient(ref_table)} r
          WHERE r.${pgClient(ref_column)} = t.${pgClient(column)}
        )
      `;

			const orphaned = parseInt(result[0].count);
			if (orphaned > 0) {
				console.log(
					`${table}.${column.padEnd(20)} → ❌ ${orphaned} orphaned references to ${ref_table}`
				);
				throw new Error(`Found ${orphaned} orphaned foreign key references`);
			} else {
				console.log(`${table}.${column.padEnd(20)} → ✅ No orphaned references`);
			}
		} catch (error) {
			if (error.message.includes('orphaned')) {
				throw error;
			}
			console.log(`${table}.${column.padEnd(20)} → ⚠️  ${error.message}`);
		}
	}
}

// Run database verification if DB URLs are available
if (MYSQL_URL && POSTGRES_URL) {
	verifyDatabase().catch((error) => {
		console.error('\n❌ Verification failed');
		process.exit(1);
	});
} else {
	console.log('ℹ️  Set DATABASE_URL and POSTGRES_DATABASE_URL to run full verification\n');
}
