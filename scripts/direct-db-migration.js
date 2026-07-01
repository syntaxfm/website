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
	'TranscriptUtteranceWord',
	// Level 4: Complex migrations requiring data transformation
	'Tag',
	'ContentTag'
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
	},
	Tag: {
		id: 'id',
		name: 'name',
		slug: 'slug'
	},
	ContentTag: {
		content_id: 'content_id',
		tag_id: 'tag_id'
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
	UserSubmission: 'user_submissions',
	Tag: 'tags',
	ContentTag: 'content_tags'
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
 * Generate a URL-safe slug from a tag name
 */
function generateSlug(name) {
	if (!name) return null;

	return name
		.toLowerCase()
		.trim()
		.replace(/^#+/, '') // Remove leading # symbols
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

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
function convertValue(value, _columnName, _tableName, _row) {
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
	const pg_table_name = TABLE_NAME_MAPPING[tableName] || tableName.toLowerCase();

	// Get column mapping
	const column_map = COLUMN_MAPPING[tableName];

	// Get MySQL columns
	const [mysql_columns] = await mysqlConn.query(
		`SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'
       ORDER BY ORDINAL_POSITION`
	);

	const mysql_col_names = mysql_columns.map((col) => col.COLUMN_NAME);

	// Incremental sync for transcript tables
	let where_clause = '';
	let incremental_mode = false;

	if (INCREMENTAL && TRANSCRIPT_TABLES.includes(tableName)) {
		const last_migration = getLastMigrationTime(tableName, migrationState);
		if (last_migration) {
			where_clause = ` WHERE updated_at > '${last_migration}' OR created_at > '${last_migration}'`;
			incremental_mode = true;
			console.log(`🔄 Incremental sync since: ${last_migration}`);
		} else {
			console.log('📦 First migration (no timestamp found)');
		}
	}

	// Get row count (with WHERE clause if incremental)
	const [count_result] = await mysqlConn.query(
		`SELECT COUNT(*) as count FROM \`${tableName}\`${where_clause}`
	);
	const total_rows = count_result[0].count;

	console.log(`📊 ${incremental_mode ? 'Changed' : 'Total'} rows: ${total_rows.toLocaleString()}`);

	if (total_rows === 0) {
		console.log('⚠️  No rows to migrate');
		return;
	}

	// Check if PostgreSQL table exists
	const table_exists = await pgClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${pg_table_name}
      )
    `;

	if (!table_exists[0].exists) {
		console.error(`❌ PostgreSQL table '${pg_table_name}' does not exist`);
		console.error('Run: pnpm db:pg:push first');
		throw new Error(`Table ${pg_table_name} does not exist`);
	}

	// Check if table already has data (when using --skip-existing)
	if (SKIP_EXISTING && MODE !== 'upsert') {
		const pg_count_result = await pgClient`
      SELECT COUNT(*) as count FROM ${pgClient(pg_table_name)}
    `;
		const existing_rows = parseInt(pg_count_result[0].count);

		if (existing_rows > 0) {
			// Only skip if counts match (fully migrated)
			if (existing_rows === total_rows) {
				console.log(`⏭️  Skipping (already complete: ${existing_rows.toLocaleString()} rows)`);
				return;
			} else {
				console.log(
					`⚠️  Partial data found (${existing_rows.toLocaleString()}/${total_rows.toLocaleString()} rows)`
				);
				console.log(`🗑️  Re-importing to ensure completeness...`);
			}
		}
	}

	// Clear existing data in PostgreSQL table (refresh mode only)
	if (MODE === 'refresh' && !incremental_mode) {
		console.log(`🗑️  Clearing existing data (refresh mode)...`);
		await pgClient`TRUNCATE TABLE ${pgClient(pg_table_name)} CASCADE`;
		console.log('✅ Cleared');
	} else if (MODE === 'upsert' || incremental_mode) {
		console.log(`🔄 Upsert mode: Will insert or update existing records`);
	}

	// Stream data in batches
	console.log('📦 Migrating data...');
	let offset = 0;
	let total_migrated = 0;
	let total_skipped = 0;
	const start_time = Date.now();

	while (offset < total_rows) {
		// Fetch batch from MySQL (with WHERE clause if incremental)
		const [rows] = await mysqlConn.query(
			`SELECT * FROM \`${tableName}\`${where_clause} LIMIT ${BATCH_SIZE} OFFSET ${offset}`
		);

		if (rows.length === 0) break;

		// Convert and insert into PostgreSQL
		const pg_rows = rows.map((row) => {
			let converted = {};
			mysql_col_names.forEach((col) => {
				const pg_col = column_map ? column_map[col] : col;
				converted[pg_col] = convertValue(row[col], col, tableName, row);
			});
			// Add computed columns (search vectors, timestamps)
			converted = addComputedColumns(row, tableName, converted);
			return converted;
		});

		// Build column list for PostgreSQL
		const pg_cols = Object.keys(pg_rows[0]);

		// Insert or upsert batch into PostgreSQL
		try {
			if (MODE === 'upsert' || incremental_mode) {
				// Upsert: ON CONFLICT DO UPDATE
				// Determine the primary key column(s)
				const pk_col = 'id'; // Most tables use 'id' as primary key

				// Build the upsert query manually
				let batch_migrated = 0;
				for (const pg_row of pg_rows) {
					try {
						await pgClient`
              INSERT INTO ${pgClient(pg_table_name)} ${pgClient([pg_row], ...pg_cols)}
              ON CONFLICT (${pgClient(pk_col)})
              DO UPDATE SET ${pgClient(
								Object.fromEntries(
									pg_cols.filter((col) => col !== pk_col).map((col) => [col, pg_row[col]])
								)
							)}
            `;
						batch_migrated++;
					} catch (rowError) {
						if (SKIP_INVALID_FK && rowError.code === '23503') {
							total_skipped++;
						} else {
							throw rowError;
						}
					}
				}
				total_migrated += batch_migrated;
			} else {
				// Regular insert
				await pgClient`
          INSERT INTO ${pgClient(pg_table_name)} ${pgClient(pg_rows, ...pg_cols)}
        `;
				total_migrated += rows.length;
			}
		} catch (error) {
			// If skip-invalid-fk is enabled and it's a foreign key error, try inserting one by one
			if (SKIP_INVALID_FK && error.code === '23503') {
				// 23503 = foreign_key_violation
				let batch_migrated = 0;
				for (const pg_row of pg_rows) {
					try {
						await pgClient`
              INSERT INTO ${pgClient(pg_table_name)} ${pgClient([pg_row], ...pg_cols)}
            `;
						batch_migrated++;
					} catch (rowError) {
						if (rowError.code === '23503') {
							total_skipped++;
							// Silently skip this row
						} else {
							throw rowError;
						}
					}
				}
				total_migrated += batch_migrated;
			} else {
				throw error;
			}
		}

		offset += BATCH_SIZE;

		// Progress
		const percent = ((total_migrated / total_rows) * 100).toFixed(1);
		const elapsed = ((Date.now() - start_time) / 1000).toFixed(1);
		const rate = (total_migrated / elapsed).toFixed(0);

		const progress_msg = `\r   Progress: ${total_migrated.toLocaleString()}/${total_rows.toLocaleString()} (${percent}%) - ${rate} rows/sec`;
		const skip_msg = total_skipped > 0 ? ` [Skipped: ${total_skipped}]` : '';
		process.stdout.write(progress_msg + skip_msg);
	}

	const total_time = ((Date.now() - start_time) / 1000).toFixed(1);

	console.log('\n✨ Table migrated!');
	console.log(`⏱️  Time: ${total_time}s`);
	console.log(`📊 Rows: ${total_migrated.toLocaleString()}`);
	if (total_skipped > 0) {
		console.log(`⚠️  Skipped: ${total_skipped.toLocaleString()} (invalid foreign keys)`);
	}
	console.log(`⚡ Rate: ${(total_migrated / total_time).toFixed(0)} rows/sec`);

	// Update migration state
	updateMigrationTime(tableName, migrationState);
	migrationState[tableName].rowCount = total_migrated;
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

async function migrateTopicsToTags(mysqlConn, pgClient, migrationState) {
	console.log('\n\n📋 Migrating: Tag');
	console.log('🔄 Converting Topics to Tags with content relationships...\n');

	try {
		const start_time = Date.now();

		// Clear existing tags and content_tags in refresh mode
		if (MODE === 'refresh') {
			console.log('🗑️  Clearing existing tags and content_tags (refresh mode)...');
			await pgClient`DELETE FROM content_tags WHERE 1=1`;
			await pgClient`DELETE FROM tags WHERE 1=1`;
			console.log('✅ Cleared\n');
		}

		// Query all topics from MySQL with JOIN to get show_number
		const [topics] = await mysqlConn.query(`
			SELECT
				t.id,
				t.name,
				asn.show_number
			FROM Topic t
			INNER JOIN AiShowNote asn ON t.showNote = asn.id
			ORDER BY asn.show_number, t.name
		`);

		const total_topics = topics.length;
		console.log(`📊 Total topics: ${total_topics.toLocaleString()}\n`);

		if (total_topics === 0) {
			console.log('⚠️  No topics to migrate');
			return;
		}

		// Track stats
		let tags_created = 0;
		let tags_reused = 0;
		let links_created = 0;
		let skipped = 0;

		// Cache for tags (slug -> id mapping for deduplication)
		const tag_cache = new Map();

		// Pre-load all existing tags from database
		console.log('🔍 Loading existing tags...');
		const existing_tags = await pgClient`SELECT id, slug FROM tags WHERE slug IS NOT NULL`;
		for (const row of existing_tags) {
			tag_cache.set(row.slug, row.id);
		}
		console.log(`   Found ${existing_tags.length} existing tags\n`);

		console.log('🔄 Processing topics and creating tags...');

		for (let i = 0; i < topics.length; i++) {
			const topic = topics[i];

			// Skip empty/null names
			if (!topic.name || topic.name.trim() === '') {
				skipped++;
				continue;
			}

			// Clean topic name: remove # prefix, trim whitespace
			const clean_name = topic.name.trim().replace(/^#+/, '');

			if (!clean_name) {
				skipped++;
				continue;
			}

			// Generate slug from cleaned name
			const slug = generateSlug(clean_name);

			if (!slug) {
				skipped++;
				continue;
			}

			// Check if we've already processed this slug
			let tag_id = tag_cache.get(slug);

			if (!tag_id) {
				// Check if tag with this slug exists in PostgreSQL
				const existing_tag = await pgClient`
					SELECT id FROM tags WHERE slug = ${slug}
				`;

				if (existing_tag.length > 0) {
					tag_id = existing_tag[0].id;
					tags_reused++;
				} else {
					// Create new tag
					const new_tag = await pgClient`
						INSERT INTO tags (id, name, slug)
						VALUES (gen_random_uuid(), ${clean_name}, ${slug})
						RETURNING id
					`;
					tag_id = new_tag[0].id;
					tags_created++;
				}

				// Cache the tag by slug
				tag_cache.set(slug, tag_id);
			} else {
				tags_reused++;
			}

			// Get show's content_id
			const show_result = await pgClient`
				SELECT content_id FROM shows WHERE number = ${topic.show_number}
			`;

			if (show_result.length === 0 || !show_result[0].content_id) {
				skipped++;
				continue;
			}

			const content_id = show_result[0].content_id;

			// Create content_tags relationship (ON CONFLICT DO NOTHING handles duplicates)
			await pgClient`
				INSERT INTO content_tags (content_id, tag_id)
				VALUES (${content_id}, ${tag_id})
				ON CONFLICT DO NOTHING
			`;

			links_created++;

			// Progress reporting
			if ((i + 1) % 100 === 0 || i === topics.length - 1) {
				const percent = (((i + 1) / total_topics) * 100).toFixed(1);
				const elapsed = ((Date.now() - start_time) / 1000).toFixed(1);
				const rate = ((i + 1) / elapsed).toFixed(0);

				process.stdout.write(
					`\r   Progress: ${(i + 1).toLocaleString()}/${total_topics.toLocaleString()} (${percent}%) - ${rate} rows/sec [Created: ${tags_created} tags, Reused: ${tags_reused} tags]`
				);
			}
		}

		const total_time = ((Date.now() - start_time) / 1000).toFixed(1);

		console.log('\n\n✨ Table migrated!');
		console.log(`⏱️  Time: ${total_time}s`);
		console.log(`📊 Unique tags created: ${tags_created.toLocaleString()}`);
		console.log(`📊 Content links created: ${links_created.toLocaleString()}`);
		if (skipped > 0) {
			console.log(`⚠️  Skipped: ${skipped.toLocaleString()} (no content_id or empty name)`);
		}
		console.log(`⚡ Rate: ${(total_topics / total_time).toFixed(0)} rows/sec`);

		// Update migration state
		updateMigrationTime('Tag', migrationState);
		migrationState.Tag.rowCount = tags_created;
		migrationState.Tag.linksCreated = links_created;
		saveMigrationState(migrationState);
	} catch (error) {
		console.error('❌ Error migrating topics to tags:', error.message);
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
	const migration_state = loadMigrationState();
	console.log(`📁 Migration state loaded from: ${MIGRATION_STATE_FILE}\n`);

	// Determine tables to migrate
	let tables_to_migrate = TABLE_NAME ? [TABLE_NAME] : DEFAULT_MIGRATION_ORDER;

	// Always filter out excluded tables (Session, etc.)
	tables_to_migrate = tables_to_migrate.filter((t) => !EXCLUDED_TABLES.includes(t));
	if (EXCLUDED_TABLES.some((t) => DEFAULT_MIGRATION_ORDER.includes(t))) {
		console.log(`🚫 Excluding tables: ${EXCLUDED_TABLES.join(', ')}`);
	}

	// Filter based on --skip-transcripts or --transcripts-only
	if (SKIP_TRANSCRIPTS) {
		tables_to_migrate = tables_to_migrate.filter((t) => !TRANSCRIPT_TABLES.includes(t));
		console.log(`⏭️  Skipping transcript tables: ${TRANSCRIPT_TABLES.join(', ')}`);
	} else if (TRANSCRIPTS_ONLY) {
		tables_to_migrate = tables_to_migrate.filter((t) => TRANSCRIPT_TABLES.includes(t));
		console.log(`📋 Migrating ONLY transcript tables: ${TRANSCRIPT_TABLES.join(', ')}`);
	}

	// Skip TranscriptUtteranceWord by default (unless --include-transcript-words is specified)
	if (SKIP_TRANSCRIPT_WORDS && !TRANSCRIPTS_ONLY) {
		tables_to_migrate = tables_to_migrate.filter((t) => t !== 'TranscriptUtteranceWord');
		console.log(
			`⏭️  Skipping TranscriptUtteranceWord (large table - use --include-transcript-words to migrate)`
		);
	}

	console.log(`📋 Tables to migrate: ${tables_to_migrate.join(', ')}`);

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
	const mysql_conn = await createConnection({
		uri: MYSQL_URL,
		ssl: { rejectUnauthorized: false }
	});

	const pg_client = postgres(POSTGRES_URL, {
		max: 1,
		ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
	});

	console.log('✅ Connected\n');

	try {
		const overall_start_time = Date.now();

		// Track if we've populated content table
		let content_table_populated = false;

		// Migrate each table in order
		for (const table_name of tables_to_migrate) {
			// Populate content table before Tag migration if needed
			if (table_name === 'Tag' && !content_table_populated && POPULATE_CONTENT) {
				// Check if Show or Video was migrated (or if we have existing shows/videos in DB)
				const show_count = await pg_client`SELECT COUNT(*) as count FROM shows`;
				const video_count = await pg_client`SELECT COUNT(*) as count FROM videos`;

				if (show_count[0].count > 0 || video_count[0].count > 0) {
					console.log('\n⚡ Populating content table before Tag migration...');
					await populateContentTable(pg_client);
					content_table_populated = true;
				}
			}

			if (table_name === 'Tag') {
				// Custom migration for Topic -> Tag + ContentTag
				await migrateTopicsToTags(mysql_conn, pg_client, migration_state);
			} else if (table_name === 'ContentTag') {
				// Skip - already handled by migrateTopicsToTags
				console.log('\n📋 Skipping ContentTag (already migrated with Tags)');
			} else {
				await migrateSingleTable(table_name, mysql_conn, pg_client, migration_state);
			}
		}

		const overall_time = ((Date.now() - overall_start_time) / 1000).toFixed(1);

		console.log('\n\n🎉 All migrations complete!');
		console.log(`⏱️  Total time: ${overall_time}s`);
		console.log(`📁 Migration state saved to: ${MIGRATION_STATE_FILE}`);

		// Populate content table if not already done and requested
		if (
			!content_table_populated &&
			POPULATE_CONTENT &&
			(tables_to_migrate.includes('Show') || tables_to_migrate.includes('Video'))
		) {
			await populateContentTable(pg_client);
		}
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message);
		throw error;
	} finally {
		await mysql_conn.end();
		await pg_client.end();
	}
}

main().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
