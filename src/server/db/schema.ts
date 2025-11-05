import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	integer,
	index,
	uniqueIndex,
	pgEnum,
	doublePrecision,
	boolean,
	serial,
	primaryKey,
	foreignKey,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Import tsvector type for full-text search
// Note: Drizzle doesn't have native tsvector support yet, so we use sql`...`
type TsVector = ReturnType<typeof sql>;

// ============================================================================
// ENUMS
// ============================================================================

export const showTypeEnum = pgEnum('show_type', ['HASTY', 'TASTY', 'SUPPER', 'SPECIAL']);

export const SUBMISSION_STATUS_VALUES = pgEnum('user_submission_status', [
	'PENDING',
	'APPROVED',
	'COMPLETED',
	'REJECTED'
]);

export const SUBMISSION_TYPE_VALUES = pgEnum('user_submission_type', [
	'POTLUCK',
	'SPOOKY',
	'GUEST',
	'FEEDBACK',
	'OTHER',
	'OSS'
]);

// ============================================================================
// USER & AUTH TABLES
// ============================================================================

export const user = pgTable(
	'users',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		github_id: integer('github_id').notNull().unique(),
		username: varchar('username', { length: 255 }),
		name: varchar('name', { length: 255 }),
		email: varchar('email', { length: 255 }).unique(),
		avatar_url: text('avatar_url'),
		twitter: varchar('twitter', { length: 255 }),
		theme: varchar('theme', { length: 50 }).default('system').notNull(),
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('users_email_idx').on(table.email),
		uniqueIndex('users_github_id_idx').on(table.github_id)
	]
);

export const role = pgTable(
	'roles',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 100 }).notNull().unique()
	},
	(table) => [uniqueIndex('roles_name_idx').on(table.name)]
);

export const userRole = pgTable(
	'user_roles',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		user_id: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role_id: uuid('role_id')
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('user_roles_user_id_idx').on(table.user_id),
		index('user_roles_role_id_idx').on(table.role_id),
		uniqueIndex('user_roles_user_role_idx').on(table.user_id, table.role_id)
	]
);

export const session = pgTable(
	'sessions',
	{
		id: serial('id').primaryKey(),
		user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
		session_token: varchar('session_token', { length: 255 }).notNull().unique(),
		access_token: varchar('access_token', { length: 255 }).unique(),
		ip: varchar('ip', { length: 50 }),
		country: varchar('country', { length: 100 }),
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('sessions_user_id_idx').on(table.user_id),
		uniqueIndex('sessions_session_token_idx').on(table.session_token),
		uniqueIndex('sessions_access_token_idx').on(table.access_token)
	]
);

// ============================================================================
// SHOW TABLES
// ============================================================================

export const show = pgTable(
	'shows',
	{
		id: text('id').primaryKey(),
		number: integer('number').notNull().unique(),
		title: text('title').notNull(), // deprecated
		slug: text('slug').notNull(), // deprecated
		date: timestamp('date', { withTimezone: true }).notNull(), // deprecated
		url: text('url').notNull(),
		youtube_url: text('youtube_url'),
		spotify_id: varchar('spotify_id', { length: 255 }),
		show_notes: text('show_notes').notNull(),
		show_type: showTypeEnum('show_type').default('SPECIAL').notNull(),
		hash: varchar('hash', { length: 100 }).notNull().unique(),
		md_file: text('md_file').notNull().unique(),
		// Full-text search vector (populated by migration script & triggers)
		search_vector: text('search_vector'), // Will be tsvector in DB
		content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }), // nullable until migration complete, no unique constraint yet
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), // deprecated
		updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull() // deprecated
	},
	(table) => [
		uniqueIndex('shows_number_idx').on(table.number),
		index('shows_date_idx').on(table.date),
		index('shows_number_date_idx').on(table.number, table.date),
		uniqueIndex('shows_hash_idx').on(table.hash),
		uniqueIndex('shows_md_file_idx').on(table.md_file),
		index('shows_show_type_idx').on(table.show_type),
		// contentIdIdx will be added after migration when all shows have content_id
		// Full-text search GIN index
		index('shows_search_vector_idx').using(
			'gin',
			sql`to_tsvector('english', ${table.search_vector})`
		)
	]
);

export const showToUser = pgTable(
	'show_to_user',
	{
		show_id: text('show_id')
			.notNull()
			.references(() => show.id, { onDelete: 'cascade' }),
		user_id: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.show_id, table.user_id] }),
		index('show_to_user_show_id_idx').on(table.show_id),
		index('show_to_user_user_id_idx').on(table.user_id)
	]
);

// ============================================================================
// GUEST TABLES
// ============================================================================

export const guest = pgTable(
	'guests',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 255 }).notNull(),
		name_slug: varchar('name_slug', { length: 255 }).notNull().unique(),
		twitter: varchar('twitter', { length: 255 }).unique(),
		github: varchar('github', { length: 255 }).unique(),
		url: text('url'),
		of: text('of').default(''),
		// Full-text search vector (populated by migration script & triggers)
		search_vector: text('search_vector') // Will be tsvector in DB
	},
	(table) => [
		index('guests_name_idx').on(table.name),
		uniqueIndex('guests_name_slug_idx').on(table.name_slug),
		uniqueIndex('guests_twitter_idx').on(table.twitter),
		uniqueIndex('guests_github_idx').on(table.github),
		// Expression index for case-insensitive name search
		index('guests_name_lower_idx').on(sql`LOWER(${table.name})`),
		// Full-text search GIN index
		index('guests_search_vector_idx').using(
			'gin',
			sql`to_tsvector('english', ${table.search_vector})`
		)
	]
);

export const showGuest = pgTable(
	'show_guests',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		show_id: text('show_id')
			.notNull()
			.references(() => show.id, { onDelete: 'cascade' }),
		guest_id: uuid('guest_id')
			.notNull()
			.references(() => guest.id, { onDelete: 'cascade' }),
		transcript_id: uuid('transcript_id').references(() => transcript.id, { onDelete: 'set null' })
	},
	(table) => [
		uniqueIndex('show_guests_show_guest_idx').on(table.show_id, table.guest_id),
		index('show_guests_show_id_idx').on(table.show_id),
		index('show_guests_guest_id_idx').on(table.guest_id),
		index('show_guests_transcript_id_idx').on(table.transcript_id)
	]
);

export const socialLink = pgTable(
	'social_links',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		guest_id: uuid('guest_id')
			.notNull()
			.references(() => guest.id, { onDelete: 'cascade' }),
		link: text('link').notNull()
	},
	(table) => [
		index('social_links_guest_id_idx').on(table.guest_id),
		uniqueIndex('social_links_link_guest_idx').on(table.link, table.guest_id)
	]
);

// ============================================================================
// TRANSCRIPT TABLES
// ============================================================================

export const transcript = pgTable(
	'transcripts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		show_number: integer('show_number')
			.notNull()
			.unique()
			.references(() => show.number, { onDelete: 'cascade' }),
		// Migration tracking for incremental sync
		pg_migrated_at: timestamp('pg_migrated_at', { withTimezone: true })
	},
	(table) => [uniqueIndex('transcripts_show_number_idx').on(table.show_number)]
);

export const transcriptUtterance = pgTable(
	'transcript_utterances',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		transcript_id: uuid('transcript_id')
			.notNull()
			.references(() => transcript.id, { onDelete: 'cascade' }),
		start: doublePrecision('start').notNull(),
		end: doublePrecision('end').notNull(),
		confidence: doublePrecision('confidence').notNull(),
		channel: integer('channel').notNull(),
		speaker: integer('speaker').notNull(),
		speaker_name: varchar('speaker_name', { length: 255 }),
		transcript_value: text('transcript_value').notNull(),
		// Migration tracking for incremental sync
		pg_migrated_at: timestamp('pg_migrated_at', { withTimezone: true })
	},
	(table) => [
		index('transcript_utterances_transcript_id_idx').on(table.transcript_id),
		index('transcript_utterances_start_idx').on(table.start),
		index('transcript_utterances_speaker_idx').on(table.speaker)
	]
);

export const transcriptUtteranceWord = pgTable(
	'transcript_utterance_words',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		transcript_utterance_id: uuid('transcript_utterance_id').notNull(),
		word: varchar('word', { length: 255 }).notNull(),
		punctuated_word: varchar('punctuated_word', { length: 255 }).notNull(),
		start: doublePrecision('start').notNull(),
		end: doublePrecision('end').notNull(),
		confidence: doublePrecision('confidence').notNull(),
		speaker: integer('speaker').notNull(),
		speaker_confidence: doublePrecision('speaker_confidence').notNull(),
		// Migration tracking for incremental sync
		pg_migrated_at: timestamp('pg_migrated_at', { withTimezone: true })
	},
	(table) => [
		index('transcript_utterance_words_utterance_id_idx').on(table.transcript_utterance_id),
		foreignKey({
			name: 'tuw_utterance_fk',
			columns: [table.transcript_utterance_id],
			foreignColumns: [transcriptUtterance.id]
		}).onDelete('cascade')
	]
);

// ============================================================================
// AI SHOW NOTE TABLES
// ============================================================================

export const aiShowNote = pgTable(
	'ai_show_notes',
	{
		id: serial('id').primaryKey(),
		show_number: integer('show_number')
			.notNull()
			.unique()
			.references(() => show.number, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull(),
		provider: varchar('provider', { length: 100 }).default('gpt3.5').notNull()
	},
	(table) => [uniqueIndex('ai_show_notes_show_number_idx').on(table.show_number)]
);

export const aiSummaryEntry = pgTable(
	'ai_summary_entries',
	{
		id: serial('id').primaryKey(),
		show_note_id: integer('show_note_id')
			.notNull()
			.references(() => aiShowNote.id, { onDelete: 'cascade' }),
		time: varchar('time', { length: 50 }).notNull(),
		text: text('text').notNull(),
		description: text('description')
	},
	(table) => [index('ai_summary_entries_show_note_id_idx').on(table.show_note_id)]
);

export const aiTweet = pgTable(
	'ai_tweets',
	{
		id: serial('id').primaryKey(),
		show_note_id: integer('show_note_id')
			.notNull()
			.references(() => aiShowNote.id, { onDelete: 'cascade' }),
		content: varchar('content', { length: 350 }).notNull()
	},
	(table) => [index('ai_tweets_show_note_id_idx').on(table.show_note_id)]
);

export const link = pgTable(
	'links',
	{
		id: serial('id').primaryKey(),
		show_note_id: integer('show_note_id')
			.notNull()
			.references(() => aiShowNote.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 500 }).notNull(),
		url: text('url').notNull(),
		timestamp: varchar('timestamp', { length: 50 })
	},
	(table) => [index('links_show_note_id_idx').on(table.show_note_id)]
);

export const aiGuest = pgTable(
	'ai_guests',
	{
		id: serial('id').primaryKey(),
		show_note_id: integer('show_note_id')
			.notNull()
			.references(() => aiShowNote.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull()
	},
	(table) => ({
		showNoteIdIdx: index('ai_guests_show_note_id_idx').on(table.show_note_id)
	})
);

export const topic = pgTable(
	'topics',
	{
		id: serial('id').primaryKey(),
		show_note_id: integer('show_note_id')
			.notNull()
			.references(() => aiShowNote.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull()
	},
	(table) => [index('topics_show_note_id_idx').on(table.show_note_id)]
);

// ============================================================================
// VIDEO & PLAYLIST TABLES
// ============================================================================

export const video = pgTable(
	'videos',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(), // deprecated
		slug: text('slug').notNull().unique(), // deprecated
		description: text('description'),
		url: text('url').notNull(),
		thumbnail: text('thumbnail').notNull(),
		published_at: timestamp('published_at', { withTimezone: true }).notNull(),
		content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }) // nullable until migration complete, no unique constraint yet
	},
	(table) => [
		uniqueIndex('videos_slug_idx').on(table.slug),
		index('videos_published_at_idx').on(table.published_at)
		// contentIdIdx will be added after migration when all videos have content_id
	]
);

export const playlist = pgTable(
	'playlists',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		slug: text('slug').notNull().unique(),
		description: text('description'),
		unlisted: boolean('unlisted').default(false), // deprecated
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('playlists_slug_idx').on(table.slug)]
);

export const playlistOnVideo = pgTable(
	'playlist_videos',
	{
		playlist_id: text('playlist_id')
			.notNull()
			.references(() => playlist.id, { onDelete: 'cascade' }),
		video_id: text('video_id')
			.notNull()
			.references(() => video.id, { onDelete: 'cascade' }),
		order: integer('order').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.playlist_id, table.video_id] }),
		index('playlist_videos_playlist_id_idx').on(table.playlist_id),
		index('playlist_videos_video_id_idx').on(table.video_id),
		index('playlist_videos_order_idx').on(table.playlist_id, table.order)
	]
);

export const showVideo = pgTable(
	'show_videos',
	{
		show_id: text('show_id')
			.notNull()
			.references(() => show.id, { onDelete: 'cascade' }),
		video_id: text('video_id')
			.notNull()
			.references(() => video.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.show_id, table.video_id] }),
		index('show_videos_show_id_idx').on(table.show_id),
		index('show_videos_video_id_idx').on(table.video_id)
	]
);

export const remotePlaylist = pgTable('remote_playlists', {
	playlist_id: varchar('playlist_id', { length: 255 }).primaryKey(),
	title: text('title').notNull(),
	videos_count: integer('videos_count').notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).notNull()
});

// ============================================================================
// USER SUBMISSION TABLE
// ============================================================================

export const userSubmission = pgTable(
	'user_submissions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 255 }),
		email: varchar('email', { length: 255 }),
		body: text('body').notNull(),
		audio_url: text('audio_url'),
		status: SUBMISSION_STATUS_VALUES('status').default('PENDING').notNull(),
		submission_type: SUBMISSION_TYPE_VALUES('submission_type').default('OTHER').notNull(),
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('user_submissions_status_idx').on(table.status),
		index('user_submissions_type_idx').on(table.submission_type),
		index('user_submissions_created_at_idx').on(table.created_at),
		// Partial index for pending submissions (frequently queried)
		index('user_submissions_pending_idx')
			.on(table.created_at)
			.where(sql`${table.status} = 'PENDING'`)
	]
);

// ============================================================================
// Article Table
// ============================================================================

export const article = pgTable(
	'articles',
	{
		id: text('id').primaryKey(),
		body: text('content').notNull(),
		author_id: uuid('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'set null' }),
		content_id: uuid('content_id')
			.notNull()
			.unique()
			.references(() => content.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('articles_author_id_idx').on(table.author_id),
		uniqueIndex('articles_content_id_idx').on(table.content_id)
	]
);

// ============================================================================
// Tags Table
// Tags can be generated via AI or by hand for shows, articles, videos, tools
// ============================================================================

export const tag = pgTable(
	'tags',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 50 }).notNull().unique(),
		slug: varchar('slug', { length: 64 })
	},
	(t) => [uniqueIndex('tags_slug_idx').on(t.slug)]
);

// ============================================================================
// Content Table
// Content is the wrapper for all content types; shows, articles, videos, tools
// ============================================================================

export const content_types = pgEnum('content_types', [
	'PODCAST',
	'ARTICLE',
	'VIDEO',
	'TOOL',
	'NEWSLETTER',
	'EVENT'
]);

export const content_status = pgEnum('content_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const content = pgTable(
	'content',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: varchar('title', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull().unique(),
		type: content_types().notNull(),
		status: content_status().default('DRAFT').notNull(),
		created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		published_at: timestamp('published_at', { withTimezone: true })
	},
	(table) => [
		uniqueIndex('content_slug_idx').on(table.slug),
		index('content_type_idx').on(table.type),
		index('content_status_idx').on(table.status),
		index('content_published_at_idx').on(table.published_at),
		index('content_type_status_idx').on(table.type, table.status),
		index('content_type_published_idx').on(table.type, table.published_at)
	]
);

export const content_tags = pgTable(
	'content_tags',
	{
		content_id: uuid('content_id')
			.notNull()
			.references(() => content.id, { onDelete: 'cascade' }),
		tag_id: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ columns: [t.content_id, t.tag_id] }),
		index('content_tags_tag_idx').on(t.tag_id),
		index('content_tags_content_idx').on(t.content_id)
	]
);

// TODO Related content table
