#!/usr/bin/env node
/**
 * Direct MySQL → PostgreSQL migration (no CSV files)
 * Streams data directly from MySQL to PostgreSQL
 * Fastest option for large tables
 *
 * Features:
 * - Incremental sync for transcript tables (only migrate changed data)
 * - UUID conversion for show/video/playlist IDs
 * - Full-text search vector generation
 * - Upsert mode for repeatable migrations
 */
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATION_STATE_FILE = path.join(__dirname, 'migration-state.json');

expand(dotenv.config());

const MYSQL_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

// Parse command line arguments
const args = process.argv.slice(2);
const TABLE_NAME = args.find((arg) => !arg.startsWith('--'));
const SKIP_EXISTING = args.includes('--skip-existing');
const SKIP_INVALID_FK = args.includes('--skip-invalid-fk'); // Skip rows with invalid foreign keys
const SKIP_TRANSCRIPTS = args.includes('--skip-transcripts'); // Skip transcript tables
const TRANSCRIPTS_ONLY = args.includes('--transcripts-only'); // Migrate only transcript tables
const SKIP_TRANSCRIPT_WORDS = !args.includes('--include-transcript-words'); // Skip TranscriptUtteranceWord by default
const INCREMENTAL = args.includes('--incremental'); // Incremental sync for transcripts
const POPULATE_CONTENT = !args.includes('--skip-populate-content'); // Run content population after migration by default
const MODE = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1] || 'refresh'; // refresh | upsert
const BATCH_SIZE = 5000;

// Transcript table names (for --skip-transcripts and --transcripts-only)
const TRANSCRIPT_TABLES = ['Transcript', 'TranscriptUtterance', 'TranscriptUtteranceWord'];

// Tables that should NEVER be imported (Session contains sensitive data)
const EXCLUDED_TABLES = ['Session'];

// Default migration order (respects foreign key dependencies)
// NOTE: Session is intentionally excluded for security reasons
const DEFAULT_MIGRATION_ORDER = [
	// Level 0: No dependencies
	'User',
	'Role',
	'Show',
	'Guest',
	'Video',
	'Playlist',
	'UserSubmission',
	'RemotePlaylist',
	// Level 1: Depends on Level 0
	// 'Session', // EXCLUDED: Contains sensitive session data
	'UserRole',
	'_ShowToUser', // Many-to-many join table
	'Transcript',
	'AiShowNote',
	'SocialLink',
	'PlaylistOnVideo',
	'ShowVideo',
	// Level 2: Depends on Level 1
	'TranscriptUtterance',
	'AiSummaryEntry',
	'AiTweet',
	'Link',
	'AiGuest',
	'Topic',
	'ShowGuest',
	// Level 3: Depends on Level 2
	'TranscriptUtteranceWord'
];

// MySQL to PostgreSQL column name mapping
const COLUMN_MAPPING = {
	User: {
		id: 'id',
		github_id: 'github_id',
		username: 'username',
		name: 'name',
		email: 'email',
		avatar_url: 'avatar_url',
		twitter: 'twitter',
		theme: 'theme',
		created_at: 'created_at',
		updated_at: 'updated_at'
	},
	Role: {
		id: 'id',
		name: 'name'
	},
	UserRole: {
		id: 'id',
		userId: 'user_id',
		roleId: 'role_id'
	},
	Session: {
		id: 'id',
		user_id: 'user_id',
		session_token: 'session_token',
		access_token: 'access_token',
		ip: 'ip',
		country: 'country',
		created_at: 'created_at',
		updated_at: 'updated_at'
	},
	Show: {
		id: 'id',
		number: 'number',
		title: 'title',
		date: 'date',
		url: 'url',
		youtube_url: 'youtube_url',
		spotify_id: 'spotify_id',
		show_notes: 'show_notes',
		hash: 'hash',
		slug: 'slug',
		md_file: 'md_file',
		created_at: 'created_at',
		updated_at: 'updated_at',
		show_type: 'show_type'
	},
	_ShowToUser: {
		A: 'show_id', // Prisma implicit many-to-many uses A and B
		B: 'user_id'
	},
	Guest: {
		id: 'id',
		name: 'name',
		name_slug: 'name_slug',
		twitter: 'twitter',
		github: 'github',
		url: 'url',
		of: 'of'
	},
	ShowGuest: {
		id: 'id',
		showId: 'show_id',
		guestId: 'guest_id',
		transcriptId: 'transcript_id'
	},
	SocialLink: {
		id: 'id',
		link: 'link',
		guest_id: 'guest_id'
	},
	Transcript: {
		id: 'id',
		show_number: 'show_number'
	},
	TranscriptUtterance: {
		id: 'id',
		start: 'start',
		end: 'end',
		confidence: 'confidence',
		channel: 'channel',
		transcript_value: 'transcript_value',
		speaker: 'speaker',
		speakerName: 'speaker_name',
		transcriptId: 'transcript_id'
	},
	TranscriptUtteranceWord: {
		id: 'id',
		word: 'word',
		start: 'start',
		end: 'end',
		confidence: 'confidence',
		speaker: 'speaker',
		speaker_confidence: 'speaker_confidence',
		punctuated_word: 'punctuated_word',
		transcriptUtteranceId: 'transcript_utterance_id'
	},
	AiShowNote: {
		id: 'id',
		show_number: 'show_number',
		title: 'title',
		description: 'description',
		provider: 'provider'
	},
	AiSummaryEntry: {
		id: 'id',
		showNote: 'show_note_id',
		time: 'time',
		text: 'text',
		description: 'description'
	},
	AiTweet: {
		id: 'id',
		showNote: 'show_note_id',
		content: 'content'
	},
	Link: {
		id: 'id',
		showNote: 'show_note_id',
		name: 'name',
		url: 'url',
		timestamp: 'timestamp'
	},
	AiGuest: {
		id: 'id',
		showNote: 'show_note_id',
		name: 'name'
	},
	Topic: {
		id: 'id',
		showNote: 'show_note_id',
		name: 'name'
	},
	Video: {
		id: 'id',
		title: 'title',
		slug: 'slug',
		description: 'description',
		url: 'url',
		thumbnail: 'thumbnail',
		published_at: 'published_at'
	},
	Playlist: {
		id: 'id',
		title: 'title',
		slug: 'slug',
		description: 'description',
		unlisted: 'unlisted',
		created_at: 'created_at'
	},
	PlaylistOnVideo: {
		playlist_id: 'playlist_id',
		video_id: 'video_id',
		order: 'order'
	},
	ShowVideo: {
		showId: 'show_id',
		videoId: 'video_id'
	},
	RemotePlaylist: {
		playlist_id: 'playlist_id',
		title: 'title',
		videos_count: 'videos_count',
		created_at: 'created_at'
	},
	UserSubmission: {
		id: 'id',
		name: 'name',
		email: 'email',
		body: 'body',
		audio_url: 'audio_url',
		status: 'status',
		submission_type: 'submission_type',
		created_at: 'created_at',
		updated_at: 'updated_at'
	}
};

// MySQL to PostgreSQL table name mapping
const TABLE_NAME_MAPPING = {
	User: 'users',
	Role: 'roles',
	UserRole: 'user_roles',
	Session: 'sessions',
	Show: 'shows',
	_ShowToUser: 'show_to_user',
	Guest: 'guests',
	ShowGuest: 'show_guests',
	SocialLink: 'social_links',
	Transcript: 'transcripts',
	TranscriptUtterance: 'transcript_utterances',
	TranscriptUtteranceWord: 'transcript_utterance_words',
	AiShowNote: 'ai_show_notes',
	AiSummaryEntry: 'ai_summary_entries',
	AiTweet: 'ai_tweets',
	Link: 'links',
	AiGuest: 'ai_guests',
	Topic: 'topics',
	Video: 'videos',
	Playlist: 'playlists',
	PlaylistOnVideo: 'playlist_videos',
	ShowVideo: 'show_videos',
	RemotePlaylist: 'remote_playlists',
	UserSubmission: 'user_submissions'
};

// ============================================================================
// MIGRATION STATE MANAGEMENT
// ============================================================================

/**
 * Load migration state from file
 */
function loadMigrationState() {
	try {
		if (fs.existsSync(MIGRATION_STATE_FILE)) {
			const data = fs.readFileSync(MIGRATION_STATE_FILE, 'utf8');
			return JSON.parse(data);
		}
	} catch (error) {
		console.warn('⚠️  Could not load migration state:', error.message);
	}
	return {};
}

/**
 * Save migration state to file
 */
function saveMigrationState(state) {
	try {
		fs.writeFileSync(MIGRATION_STATE_FILE, JSON.stringify(state, null, 2));
	} catch (error) {
		console.warn('⚠️  Could not save migration state:', error.message);
	}
}

/**
 * Get last migration timestamp for a table
 */
function getLastMigrationTime(tableName, state) {
	return state[tableName]?.lastMigration || null;
}

/**
 * Update migration timestamp for a table
 */
function updateMigrationTime(tableName, state) {
	if (!state[tableName]) {
		state[tableName] = {};
	}
	state[tableName].lastMigration = new Date().toISOString();
	state[tableName].rowCount = 0; // Will be updated later
	saveMigrationState(state);
}

// ============================================================================
// TYPE TRANSFORMERS
// ============================================================================

/**
 * Generate full-text search vector from text fields
 */
function generateSearchVector(row, fields) {
	const text = fields
		.map((field) => row[field])
		.filter(Boolean)
		.join(' ');
	// Return the text; PostgreSQL will convert to tsvector
	return text || null;
}

/**
 * Transform values for PostgreSQL
 */
function convertValue(value, columnName, tableName, row) {
	if (value === null || value === undefined) {
		return null;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	// Only convert actual booleans, not numeric values
	if (typeof value === 'boolean') {
		return Boolean(value);
	}

	// UUID conversion: MySQL varchar UUIDs are already valid, just pass through
	// PostgreSQL will handle the casting from text to uuid type

	return value;
}

/**
 * Add computed columns (search vectors, migration tracking)
 */
function addComputedColumns(row, tableName, pgRow) {
	// Add search vectors for shows
	if (tableName === 'Show') {
		pgRow.search_vector = generateSearchVector(row, ['title', 'slug', 'show_notes']);
	}

	// Add search vectors for guests
	if (tableName === 'Guest') {
		pgRow.search_vector = generateSearchVector(row, ['name', 'of']);
	}

	// Add migration timestamp for transcript tables
	if (TRANSCRIPT_TABLES.includes(tableName)) {
		pgRow.pg_migrated_at = new Date().toISOString();
	}

	return pgRow;
}

async function migrateSingleTable(tableName, mysqlConn, pgClient, migrationState) {
	console.log(`\n📋 Migrating: ${tableName}`);

	// Get PostgreSQL table name
	const pgTableName = TABLE_NAME_MAPPING[tableName] || tableName.toLowerCase();

	// Get column mapping
	const columnMap = COLUMN_MAPPING[tableName];

	// Get MySQL columns
	const [mysqlColumns] = await mysqlConn.query(
		`SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'
       ORDER BY ORDINAL_POSITION`
	);

	const mysqlColNames = mysqlColumns.map((col) => col.COLUMN_NAME);

	// Incremental sync for transcript tables
	let whereClause = '';
	let incrementalMode = false;

	if (INCREMENTAL && TRANSCRIPT_TABLES.includes(tableName)) {
		const lastMigration = getLastMigrationTime(tableName, migrationState);
		if (lastMigration) {
			whereClause = ` WHERE updated_at > '${lastMigration}' OR created_at > '${lastMigration}'`;
			incrementalMode = true;
			console.log(`🔄 Incremental sync since: ${lastMigration}`);
		} else {
			console.log('📦 First migration (no timestamp found)');
		}
	}

	// Get row count (with WHERE clause if incremental)
	const [countResult] = await mysqlConn.query(
		`SELECT COUNT(*) as count FROM \`${tableName}\`${whereClause}`
	);
	const totalRows = countResult[0].count;

	console.log(`📊 ${incrementalMode ? 'Changed' : 'Total'} rows: ${totalRows.toLocaleString()}`);

	if (totalRows === 0) {
		console.log('⚠️  No rows to migrate');
		return;
	}

	// Check if PostgreSQL table exists
	const tableExists = await pgClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${pgTableName}
      )
    `;

	if (!tableExists[0].exists) {
		console.error(`❌ PostgreSQL table '${pgTableName}' does not exist`);
		console.error('Run: pnpm db:pg:push first');
		throw new Error(`Table ${pgTableName} does not exist`);
	}

	// Check if table already has data (when using --skip-existing)
	if (SKIP_EXISTING && MODE !== 'upsert') {
		const pgCountResult = await pgClient`
      SELECT COUNT(*) as count FROM ${pgClient(pgTableName)}
    `;
		const existingRows = parseInt(pgCountResult[0].count);

		if (existingRows > 0) {
			// Only skip if counts match (fully migrated)
			if (existingRows === totalRows) {
				console.log(`⏭️  Skipping (already complete: ${existingRows.toLocaleString()} rows)`);
				return;
			} else {
				console.log(
					`⚠️  Partial data found (${existingRows.toLocaleString()}/${totalRows.toLocaleString()} rows)`
				);
				console.log(`🗑️  Re-importing to ensure completeness...`);
			}
		}
	}

	// Clear existing data in PostgreSQL table (refresh mode only)
	if (MODE === 'refresh' && !incrementalMode) {
		console.log(`🗑️  Clearing existing data (refresh mode)...`);
		await pgClient`TRUNCATE TABLE ${pgClient(pgTableName)} CASCADE`;
		console.log('✅ Cleared');
	} else if (MODE === 'upsert' || incrementalMode) {
		console.log(`🔄 Upsert mode: Will insert or update existing records`);
	}

	// Stream data in batches
	console.log('📦 Migrating data...');
	let offset = 0;
	let totalMigrated = 0;
	let totalSkipped = 0;
	const startTime = Date.now();

	while (offset < totalRows) {
		// Fetch batch from MySQL (with WHERE clause if incremental)
		const [rows] = await mysqlConn.query(
			`SELECT * FROM \`${tableName}\`${whereClause} LIMIT ${BATCH_SIZE} OFFSET ${offset}`
		);

		if (rows.length === 0) break;

		// Convert and insert into PostgreSQL
		const pgRows = rows.map((row) => {
			let converted = {};
			mysqlColNames.forEach((col) => {
				const pgCol = columnMap ? columnMap[col] : col;
				converted[pgCol] = convertValue(row[col], col, tableName, row);
			});
			// Add computed columns (search vectors, timestamps)
			converted = addComputedColumns(row, tableName, converted);
			return converted;
		});

		// Build column list for PostgreSQL
		const pgCols = Object.keys(pgRows[0]);

		// Insert or upsert batch into PostgreSQL
		try {
			if (MODE === 'upsert' || incrementalMode) {
				// Upsert: ON CONFLICT DO UPDATE
				// Determine the primary key column(s)
				const pkCol = 'id'; // Most tables use 'id' as primary key

				// Build the upsert query manually
				let batchMigrated = 0;
				for (const pgRow of pgRows) {
					try {
						await pgClient`
              INSERT INTO ${pgClient(pgTableName)} ${pgClient([pgRow], ...pgCols)}
              ON CONFLICT (${pgClient(pkCol)})
              DO UPDATE SET ${pgClient(
								Object.fromEntries(
									pgCols.filter((col) => col !== pkCol).map((col) => [col, pgRow[col]])
								)
							)}
            `;
						batchMigrated++;
					} catch (rowError) {
						if (SKIP_INVALID_FK && rowError.code === '23503') {
							totalSkipped++;
						} else {
							throw rowError;
						}
					}
				}
				totalMigrated += batchMigrated;
			} else {
				// Regular insert
				await pgClient`
          INSERT INTO ${pgClient(pgTableName)} ${pgClient(pgRows, ...pgCols)}
        `;
				totalMigrated += rows.length;
			}
		} catch (error) {
			// If skip-invalid-fk is enabled and it's a foreign key error, try inserting one by one
			if (SKIP_INVALID_FK && error.code === '23503') {
				// 23503 = foreign_key_violation
				let batchMigrated = 0;
				for (const pgRow of pgRows) {
					try {
						await pgClient`
              INSERT INTO ${pgClient(pgTableName)} ${pgClient([pgRow], ...pgCols)}
            `;
						batchMigrated++;
					} catch (rowError) {
						if (rowError.code === '23503') {
							totalSkipped++;
							// Silently skip this row
						} else {
							throw rowError;
						}
					}
				}
				totalMigrated += batchMigrated;
			} else {
				throw error;
			}
		}

		offset += BATCH_SIZE;

		// Progress
		const percent = ((totalMigrated / totalRows) * 100).toFixed(1);
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
		const rate = (totalMigrated / elapsed).toFixed(0);

		const progressMsg = `\r   Progress: ${totalMigrated.toLocaleString()}/${totalRows.toLocaleString()} (${percent}%) - ${rate} rows/sec`;
		const skipMsg = totalSkipped > 0 ? ` [Skipped: ${totalSkipped}]` : '';
		process.stdout.write(progressMsg + skipMsg);
	}

	const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

	console.log('\n✨ Table migrated!');
	console.log(`⏱️  Time: ${totalTime}s`);
	console.log(`📊 Rows: ${totalMigrated.toLocaleString()}`);
	if (totalSkipped > 0) {
		console.log(`⚠️  Skipped: ${totalSkipped.toLocaleString()} (invalid foreign keys)`);
	}
	console.log(`⚡ Rate: ${(totalMigrated / totalTime).toFixed(0)} rows/sec`);

	// Update migration state
	updateMigrationTime(tableName, migrationState);
	migrationState[tableName].rowCount = totalMigrated;
	saveMigrationState(migrationState);
}

async function populateContentTable(pgClient) {
	console.log('\n\n📦 Populating content table from existing shows and videos...');

	try {
		// Clear existing content table - do this BEFORE resetting foreign keys
		console.log('🗑️  Clearing existing content table...');
		await pgClient`DELETE FROM content WHERE 1=1`;
		console.log('✅ Cleared');

		// Get all shows
		const shows = await pgClient`
			SELECT id, title, slug, created_at, date
			FROM shows
			ORDER BY number
		`;

		// Get all videos
		const videos = await pgClient`
			SELECT id, title, slug, published_at
			FROM videos
			ORDER BY published_at
		`;

		console.log(`📊 Found ${shows.length} shows and ${videos.length} videos to process`);

		// Global slug counter to handle duplicates
		const slug_counts = new Map();
		let show_counter = 0;
		let video_counter = 0;

		// Process shows
		for (const show_item of shows) {
			// Handle duplicate slugs
			let unique_slug = show_item.slug;
			const count = slug_counts.get(show_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${show_item.slug}-${count}`;
			}
			slug_counts.set(show_item.slug, count + 1);

			try {
				await pgClient.begin(async (tx) => {
					// Create content record
					const [new_content] = await tx`
						INSERT INTO content (title, slug, type, status, created_at, updated_at, published_at)
						VALUES (
							${show_item.title},
							${unique_slug},
							'PODCAST',
							'PUBLISHED',
							${show_item.created_at},
							NOW(),
							${show_item.date}
						)
						RETURNING id
					`;

					// Update show with content_id
					await tx`
						UPDATE shows
						SET content_id = ${new_content.id}
						WHERE id = ${show_item.id}
					`;
				});

				show_counter++;
			} catch (err) {
				console.error(`❌ Failed to process show ${show_item.id}:`, err.message);
			}
		}

		// Process videos
		for (const video_item of videos) {
			// Handle duplicate slugs
			let unique_slug = video_item.slug;
			const count = slug_counts.get(video_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${video_item.slug}-${count}`;
			}
			slug_counts.set(video_item.slug, count + 1);

			try {
				await pgClient.begin(async (tx) => {
					// Create content record
					const [new_content] = await tx`
						INSERT INTO content (title, slug, type, status, created_at, updated_at, published_at)
						VALUES (
							${video_item.title},
							${unique_slug},
							'VIDEO',
							'PUBLISHED',
							NOW(),
							NOW(),
							${video_item.published_at}
						)
						RETURNING id
					`;

					// Update video with content_id
					await tx`
						UPDATE videos
						SET content_id = ${new_content.id}
						WHERE id = ${video_item.id}
					`;
				});

				video_counter++;
			} catch (err) {
				console.error(`❌ Failed to process video ${video_item.id}:`, err.message);
			}
		}

		console.log(`✅ Content population complete!`);
		console.log(`   Shows: ${show_counter}`);
		console.log(`   Videos: ${video_counter}`);
	} catch (error) {
		console.error('❌ Error populating content:', error.message);
		throw error;
	}
}

async function main() {
	console.log(`🚀 Direct MySQL → PostgreSQL Migration\n`);

	if (!MYSQL_URL) {
		console.error('❌ ERROR: MySQL DATABASE_URL is not set');
		process.exit(1);
	}

	if (!POSTGRES_URL) {
		console.error('❌ ERROR: POSTGRES_DATABASE_URL is not set');
		process.exit(1);
	}

	// Load migration state
	const migrationState = loadMigrationState();
	console.log(`📁 Migration state loaded from: ${MIGRATION_STATE_FILE}\n`);

	// Determine tables to migrate
	let tablesToMigrate = TABLE_NAME ? [TABLE_NAME] : DEFAULT_MIGRATION_ORDER;

	// Always filter out excluded tables (Session, etc.)
	tablesToMigrate = tablesToMigrate.filter((t) => !EXCLUDED_TABLES.includes(t));
	if (EXCLUDED_TABLES.some((t) => DEFAULT_MIGRATION_ORDER.includes(t))) {
		console.log(`🚫 Excluding tables: ${EXCLUDED_TABLES.join(', ')}`);
	}

	// Filter based on --skip-transcripts or --transcripts-only
	if (SKIP_TRANSCRIPTS) {
		tablesToMigrate = tablesToMigrate.filter((t) => !TRANSCRIPT_TABLES.includes(t));
		console.log(`⏭️  Skipping transcript tables: ${TRANSCRIPT_TABLES.join(', ')}`);
	} else if (TRANSCRIPTS_ONLY) {
		tablesToMigrate = tablesToMigrate.filter((t) => TRANSCRIPT_TABLES.includes(t));
		console.log(`📋 Migrating ONLY transcript tables: ${TRANSCRIPT_TABLES.join(', ')}`);
	}

	// Skip TranscriptUtteranceWord by default (unless --include-transcript-words is specified)
	if (SKIP_TRANSCRIPT_WORDS && !TRANSCRIPTS_ONLY) {
		tablesToMigrate = tablesToMigrate.filter((t) => t !== 'TranscriptUtteranceWord');
		console.log(
			`⏭️  Skipping TranscriptUtteranceWord (large table - use --include-transcript-words to migrate)`
		);
	}

	console.log(`📋 Tables to migrate: ${tablesToMigrate.join(', ')}`);

	const modes = [];
	modes.push(`Mode: ${MODE}`);
	if (SKIP_EXISTING) {
		modes.push('Skip complete tables');
	}
	if (SKIP_INVALID_FK) {
		modes.push('Skip invalid FKs');
	}
	if (INCREMENTAL) {
		modes.push('Incremental sync');
	}
	if (POPULATE_CONTENT) {
		modes.push('Auto-populate content');
	} else {
		modes.push('Skip content population');
	}
	console.log(`⚙️  ${modes.join(', ')}\n`);

	// Connect to both databases
	console.log('🔌 Connecting to databases...');
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
		const overallStartTime = Date.now();

		// Migrate each table in order
		for (const tableName of tablesToMigrate) {
			await migrateSingleTable(tableName, mysqlConn, pgClient, migrationState);
		}

		const overallTime = ((Date.now() - overallStartTime) / 1000).toFixed(1);

		console.log('\n\n🎉 All migrations complete!');
		console.log(`⏱️  Total time: ${overallTime}s`);
		console.log(`📁 Migration state saved to: ${MIGRATION_STATE_FILE}`);

		// Automatically populate content table if requested
		if (
			POPULATE_CONTENT &&
			(tablesToMigrate.includes('Show') || tablesToMigrate.includes('Video'))
		) {
			await populateContentTable(pgClient);
		}
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message);
		throw error;
	} finally {
		await mysqlConn.end();
		await pgClient.end();
	}
}

main().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
