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
	jsonb
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { SeoCallError, SeoReport } from '../seo_tracker/seo_report';

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
// PROFILES & AUTHORIZATION TABLES
// ============================================================================

export const profile = pgTable(
	'profiles',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		central_user_id: text('central_user_id').unique(),
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
		index('profiles_email_idx').on(table.email),
		uniqueIndex('profiles_central_user_id_idx').on(table.central_user_id),
		uniqueIndex('profiles_github_id_idx').on(table.github_id)
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

export const profileRole = pgTable(
	'profile_roles',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profile.id, { onDelete: 'cascade' }),
		role_id: uuid('role_id')
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('profile_roles_profile_id_idx').on(table.profile_id),
		index('profile_roles_role_id_idx').on(table.role_id),
		uniqueIndex('profile_roles_profile_role_idx').on(table.profile_id, table.role_id)
	]
);

// ============================================================================
// SHOW TABLES
// ============================================================================

export const show = pgTable(
	'shows',
	{
		id: text('id').primaryKey(),
		number: integer('number').unique(),
		title: text('title').notNull(), // deprecated
		slug: text('slug').notNull(), // deprecated
		date: timestamp('date', { withTimezone: true }).notNull(), // deprecated
		url: text('url'),
		youtube_url: text('youtube_url'),
		spotify_id: varchar('spotify_id', { length: 255 }),
		show_notes: text('show_notes').notNull(),
		show_type: showTypeEnum('show_type').default('SPECIAL').notNull(),
		hash: varchar('hash', { length: 100 }).notNull().unique(),
		md_file: text('md_file').unique(),
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

// Who hosts a piece of content (an episode, a video), by its permanent content id. Replaces
// show_to_profile, which linked by show id and so broke when an episode was renumbered.
export const contentHost = pgTable(
	'content_hosts',
	{
		content_id: uuid('content_id')
			.notNull()
			.references(() => content.id, { onDelete: 'cascade' }),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profile.id, { onDelete: 'cascade' }),
		// The order hosts were added in, which is the order pages list them
		position: serial('position').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.content_id, table.profile_id] }),
		index('content_hosts_profile_id_idx').on(table.profile_id)
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

// Who guests on a piece of content (an episode, a video), by its permanent content id. Replaces
// show_guests, which linked by show id.
export const contentGuest = pgTable(
	'content_guests',
	{
		content_id: uuid('content_id')
			.notNull()
			.references(() => content.id, { onDelete: 'cascade' }),
		guest_id: uuid('guest_id')
			.notNull()
			.references(() => guest.id, { onDelete: 'cascade' }),
		// The order guests were added in, which is the order pages list them (main guest first)
		position: serial('position').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.content_id, table.guest_id] }),
		index('content_guests_guest_id_idx').on(table.guest_id)
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

export const transcript = pgTable('transcripts', {
	id: uuid('id').defaultRandom().primaryKey(),
	// The episode or video this is the transcript of
	content_id: uuid('content_id')
		.unique()
		.references(() => content.id, { onDelete: 'cascade' }),
	// Migration tracking for incremental sync
	pg_migrated_at: timestamp('pg_migrated_at', { withTimezone: true })
});

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

export const aiShowNote = pgTable('ai_show_notes', {
	id: serial('id').primaryKey(),
	// The episode or video these notes are for
	content_id: uuid('content_id')
		.unique()
		.references(() => content.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description').notNull(),
	provider: varchar('provider', { length: 100 }).default('gpt3.5').notNull()
});

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
		// From YouTube on each sync (src/server/video/video_sync.ts)
		duration_seconds: integer('duration_seconds'),
		view_count: integer('view_count'),
		content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }) // nullable until migration complete, no unique constraint yet
	},
	(table) => [
		uniqueIndex('videos_slug_idx').on(table.slug),
		index('videos_published_at_idx').on(table.published_at)
		// contentIdIdx will be added after migration when all videos have content_id
	]
);

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
			.references(() => profile.id, { onDelete: 'set null' }),
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

// TOPIC: a broad subject from the curated list (CSS, AI Coding). LIBRARY: a named library, framework
// or tool (Effect, Nuxt). Null: a legacy tag from before the tag engine (src/server/tags).
export const tag_kinds = pgEnum('tag_kinds', ['TOPIC', 'LIBRARY']);

export const tag = pgTable(
	'tags',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 50 }).notNull().unique(),
		slug: varchar('slug', { length: 64 }),
		kind: tag_kinds(),
		// A topic's meaning, given to the model that tags content
		description: text('description')
	},
	(t) => [uniqueIndex('tags_slug_idx').on(t.slug), index('tags_kind_idx').on(t.kind)]
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

export const content_tag_sources = pgEnum('content_tag_sources', ['AI', 'EDITOR']);

export const content_tags = pgTable(
	'content_tags',
	{
		content_id: uuid('content_id')
			.notNull()
			.references(() => content.id, { onDelete: 'cascade' }),
		tag_id: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' }),
		// AI tags are replaced each time the tag engine runs on the content; an editor's are kept
		source: content_tag_sources('source').default('EDITOR').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.content_id, t.tag_id] }),
		index('content_tags_tag_idx').on(t.tag_id),
		index('content_tags_content_idx').on(t.content_id)
	]
);

// When the tag engine last tagged a piece of content, and from what. Content tagged before its
// transcript existed is tagged again once it has one.
export const content_tagging = pgTable('content_tagging', {
	content_id: uuid('content_id')
		.primaryKey()
		.references(() => content.id, { onDelete: 'cascade' }),
	model: text('model').notNull(),
	from_transcript: boolean('from_transcript').notNull(),
	tagged_at: timestamp('tagged_at', { withTimezone: true }).defaultNow().notNull()
});

// ============================================================================
// Newsletter Issues Table
// Snack Pack issues, copied from Kit (src/server/newsletter/sync_issues.ts). Kit stays the source
// of truth: the copy lets the site list issues without waiting on Kit's slow API.
// ============================================================================

export const newsletter_issue = pgTable(
	'newsletter_issues',
	{
		// Kit's broadcast id, which /snackpack/[issue_id] uses
		id: text('id').primaryKey(),
		issue_number: integer('issue_number'),
		content_id: uuid('content_id')
			.notNull()
			.unique()
			.references(() => content.id, { onDelete: 'cascade' })
	},
	(table) => [uniqueIndex('newsletter_issues_content_id_idx').on(table.content_id)]
);

// TODO Related content table

// ============================================================================
// SEO TRACKER
// ============================================================================

// One row per SEO snapshot taken from /admin/seo: Google rankings, tracked Google and YouTube
// searches, competitors and backlinks, normalized (src/server/seo_tracker/seo_report.ts)
export const seo_snapshot = pgTable(
	'seo_snapshots',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		taken_at: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
		// Firecrawl credits the snapshot cost
		credits_cost: integer('credits_cost').notNull(),
		report: jsonb('report').$type<SeoReport>().notNull(),
		// Calls that failed; the matching report sections are empty
		errors: jsonb('errors').$type<SeoCallError[]>().notNull()
	},
	(table) => [index('seo_snapshots_taken_at_idx').on(table.taken_at)]
);

// ============================================================================
// OAUTH CONNECTIONS
// ============================================================================

// Accounts an admin connected so scheduled jobs can act as them: 'youtube' is the Syntax channel's
// owner, for downloading captions (src/server/video/youtube_owner.ts). Written when an admin signs
// in through Connect YouTube; the refresh token never leaves the server.
export const oauth_connection = pgTable('oauth_connections', {
	provider: varchar('provider', { length: 32 }).primaryKey(),
	refresh_token: text('refresh_token').notNull(),
	// What the sign-in was for, e.g. the YouTube channel's name, to show in admin
	account_name: text('account_name'),
	connected_by: uuid('connected_by').references(() => profile.id, { onDelete: 'set null' }),
	connected_at: timestamp('connected_at', { withTimezone: true }).notNull(),
	// Set when the provider refuses the refresh token (expired or revoked); cleared on reconnect
	failed_at: timestamp('failed_at', { withTimezone: true }),
	failure: text('failure')
});
