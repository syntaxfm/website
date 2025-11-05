import {
	mysqlTable,
	primaryKey,
	varchar,
	datetime,
	text,
	int,
	index,
	unique,
	mysqlEnum,
	double,
	tinyint,
	type AnyMySqlColumn
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const prismaMigrations = mysqlTable(
	'_prisma_migrations',
	{
		id: varchar({ length: 36 }).notNull(),
		checksum: varchar({ length: 64 }).notNull(),
		finished_at: datetime('finished_at', { mode: 'string', fsp: 3 }),
		migration_name: varchar('migration_name', { length: 255 }).notNull(),
		logs: text(),
		rolled_back_at: datetime('rolled_back_at', { mode: 'string', fsp: 3 }),
		started_at: datetime('started_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		applied_steps_count: int('applied_steps_count', { unsigned: true }).default(0).notNull()
	},
	(table) => [primaryKey({ columns: [table.id], name: '_prisma_migrations_id' })]
);

export const showToUser = mysqlTable(
	'_ShowToUser',
	{
		a: varchar('A', { length: 191 }).notNull(),
		b: varchar('B', { length: 191 }).notNull()
	},
	(table) => [
		index('_ShowToUser_B_index').on(table.b),
		unique('_ShowToUser_AB_unique').on(table.a, table.b)
	]
);

export const aiGuest = mysqlTable(
	'AiGuest',
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 191 }).notNull(),
		show_note: int('showNote').notNull()
	},
	(table) => [primaryKey({ columns: [table.id], name: 'AiGuest_id' })]
);

export const aiShowNote = mysqlTable(
	'AiShowNote',
	{
		id: int().autoincrement().notNull(),
		show_number: int('show_number').notNull(),
		title: varchar({ length: 191 }).notNull(),
		description: varchar({ length: 1500 }).notNull(),
		provider: varchar({ length: 191 }).default('gpt3.5').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'AiShowNote_id' }),
		unique('AiShowNote_show_number_key').on(table.show_number)
	]
);

export const aiSummaryEntry = mysqlTable(
	'AiSummaryEntry',
	{
		id: int().autoincrement().notNull(),
		time: varchar({ length: 191 }).notNull(),
		text: varchar({ length: 191 }).notNull(),
		description: varchar({ length: 191 }),
		show_note: int('showNote').notNull()
	},
	(table) => [
		index('AiSummaryEntry_showNote_idx').on(table.show_note),
		primaryKey({ columns: [table.id], name: 'AiSummaryEntry_id' })
	]
);

export const aiTweet = mysqlTable(
	'AiTweet',
	{
		id: int().autoincrement().notNull(),
		content: varchar({ length: 350 }).notNull(),
		show_note: int('showNote').notNull()
	},
	(table) => [primaryKey({ columns: [table.id], name: 'AiTweet_id' })]
);

export const guest = mysqlTable(
	'Guest',
	{
		id: varchar({ length: 191 }).notNull(),
		name: varchar({ length: 191 }).notNull(),
		name_slug: varchar('name_slug', { length: 191 }).notNull(),
		twitter: varchar({ length: 191 }),
		github: varchar({ length: 191 }),
		url: varchar({ length: 191 }),
		of: varchar({ length: 191 }).default('')
	},
	(table) => [
		index('Guest_name_idx').on(table.name),
		primaryKey({ columns: [table.id], name: 'Guest_id' }),
		unique('Guest_name_slug_key').on(table.name_slug),
		unique('Guest_twitter_key').on(table.twitter),
		unique('Guest_github_key').on(table.github)
	]
);

export const link = mysqlTable(
	'Link',
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 191 }).notNull(),
		url: varchar({ length: 191 }).notNull(),
		timestamp: varchar({ length: 191 }),
		show_note: int('showNote').notNull()
	},
	(table) => [primaryKey({ columns: [table.id], name: 'Link_id' })]
);

export const playlist = mysqlTable(
	'Playlist',
	{
		id: varchar({ length: 191 }).notNull(),
		title: varchar({ length: 191 }).notNull(),
		description: text(),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		slug: varchar({ length: 191 }).notNull(),
		unlisted: tinyint().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'Playlist_id' }),
		unique('Playlist_slug_key').on(table.slug)
	]
);

export const playlistOnVideo = mysqlTable(
	'PlaylistOnVideo',
	{
		video_id: varchar('video_id', { length: 191 }).notNull(),
		playlist_id: varchar('playlist_id', { length: 191 }).notNull(),
		order: int('order').notNull()
	},
	(table) => [
		index('PlaylistOnVideo_video_id_idx').on(table.video_id),
		index('PlaylistOnVideo_playlist_id_idx').on(table.playlist_id),
		primaryKey({
			columns: [table.video_id, table.playlist_id],
			name: 'PlaylistOnVideo_video_id_playlist_id'
		}),
		unique('PlaylistOnVideo_video_id_playlist_id_key').on(table.video_id, table.playlist_id)
	]
);

export const remotePlaylist = mysqlTable(
	'RemotePlaylist',
	{
		playlist_id: varchar('playlist_id', { length: 191 }).notNull(),
		title: varchar({ length: 191 }).notNull(),
		videos_count: int('videos_count').notNull(),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 }).notNull()
	},
	(table) => [primaryKey({ columns: [table.playlist_id], name: 'RemotePlaylist_playlist_id' })]
);

export const role = mysqlTable(
	'Role',
	{
		id: varchar({ length: 191 }).notNull(),
		name: varchar({ length: 191 }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'Role_id' }),
		unique('Role_name_key').on(table.name)
	]
);

export const session = mysqlTable(
	'Session',
	{
		id: int().autoincrement().notNull(),
		user_id: varchar('user_id', { length: 191 }),
		access_token: varchar('access_token', { length: 191 }),
		session_token: varchar('session_token', { length: 191 }).notNull(),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		updated_at: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
		ip: varchar({ length: 191 }),
		country: varchar({ length: 191 })
	},
	(table) => [
		index('Session_user_id_idx').on(table.user_id),
		primaryKey({ columns: [table.id], name: 'Session_id' }),
		unique('Session_session_token_key').on(table.session_token),
		unique('Session_access_token_key').on(table.access_token)
	]
);

export const show = mysqlTable(
	'Show',
	{
		id: varchar({ length: 191 }).notNull(),
		number: int('number').notNull(),
		title: text().notNull(),
		date: datetime({ mode: 'string', fsp: 3 }).notNull(),
		url: varchar({ length: 191 }).notNull(),
		show_notes: text('show_notes').notNull(),
		hash: varchar({ length: 191 }).notNull(),
		slug: varchar({ length: 191 }).notNull(),
		md_file: varchar('md_file', { length: 191 }).notNull(),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		updated_at: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
		show_type: mysqlEnum('show_type', ['HASTY', 'TASTY', 'SUPPER', 'SPECIAL'])
			.default('SPECIAL')
			.notNull(),
		youtube_url: varchar('youtube_url', { length: 191 }),
		spotify_id: varchar('spotify_id', { length: 191 })
	},
	(table) => [
		index('idx_show_number_date').on(table.number, table.date),
		index('Show_number_idx').on(table.number),
		primaryKey({ columns: [table.id], name: 'Show_id' }),
		unique('Show_number_key').on(table.number),
		unique('Show_hash_key').on(table.hash),
		unique('Show_md_file_key').on(table.md_file)
	]
);

export const show_guest = mysqlTable(
	'ShowGuest',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		show_id: varchar('show_id', { length: 191 })
			.notNull()
			.references(() => show.id, { onDelete: 'cascade' }),
		guest_id: varchar('guest_id', { length: 191 })
			.notNull()
			.references(() => guest.id, { onDelete: 'cascade' }),
		transcript_id: varchar('transcript_id', { length: 191 })
	},
	(table) => [
		index('ShowGuest_transcriptId_idx').on(table.transcript_id),
		index('ShowGuest_guestId_idx').on(table.guest_id),
		primaryKey({ columns: [table.id], name: 'ShowGuest_id' }),
		unique('ShowGuest_showId_guestId_key').on(table.show_id, table.guest_id)
	]
);

export const showVideo = mysqlTable(
	'ShowVideo',
	{
		show_id: varchar({ length: 191 }).notNull(),
		video_id: varchar({ length: 191 }).notNull()
	},
	(table) => [
		index('ShowVideo_showId_idx').on(table.show_id),
		index('ShowVideo_videoId_idx').on(table.video_id),
		primaryKey({ columns: [table.show_id, table.video_id], name: 'ShowVideo_showId_videoId' })
	]
);

export const socialLink = mysqlTable(
	'SocialLink',
	{
		id: varchar({ length: 191 }).notNull(),
		link: varchar({ length: 191 }).notNull(),
		guest_id: varchar('guest_id', { length: 191 }).notNull()
	},
	(table) => [
		index('SocialLink_guest_id_idx').on(table.guest_id),
		primaryKey({ columns: [table.id], name: 'SocialLink_id' }),
		unique('SocialLink_link_guest_id_key').on(table.link, table.guest_id)
	]
);

export const topic = mysqlTable(
	'Topic',
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 191 }).notNull(),
		show_note: int('showNote').notNull()
	},
	(table) => [
		index('Topic_showNote_idx').on(table.show_note),
		primaryKey({ columns: [table.id], name: 'Topic_id' })
	]
);

export const transcript = mysqlTable(
	'Transcript',
	{
		id: varchar({ length: 191 }).notNull(),
		show_number: int('show_number').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'Transcript_id' }),
		unique('Transcript_show_number_key').on(table.show_number)
	]
);

export const transcriptUtterance = mysqlTable(
	'TranscriptUtterance',
	{
		id: varchar({ length: 191 }).notNull(),
		start: double().notNull(),
		end: double().notNull(),
		confidence: double().notNull(),
		channel: int('channel').notNull(),
		transcript_value: text('transcript_value').notNull(),
		speaker: int().notNull(),
		speaker_name: varchar({ length: 191 }),
		transcript_id: varchar({ length: 191 }).notNull()
	},
	(table) => [
		index('TranscriptUtterance_transcriptId_idx').on(table.transcript_id),
		primaryKey({ columns: [table.id], name: 'TranscriptUtterance_id' })
	]
);

export const transcriptUtteranceWord = mysqlTable(
	'TranscriptUtteranceWord',
	{
		id: varchar({ length: 191 }).notNull(),
		word: varchar({ length: 191 }).notNull(),
		start: double().notNull(),
		end: double().notNull(),
		confidence: double().notNull(),
		speaker: int().notNull(),
		speaker_confidence: double('speaker_confidence').notNull(),
		punctuated_word: varchar('punctuated_word', { length: 191 }).notNull(),
		transcript_utterance_id: varchar({ length: 191 }).notNull()
	},
	(table) => [
		index('TranscriptUtteranceWord_transcriptUtteranceId_idx').on(table.transcript_utterance_id),
		primaryKey({ columns: [table.id], name: 'TranscriptUtteranceWord_id' })
	]
);

export const user = mysqlTable(
	'User',
	{
		id: varchar({ length: 191 }).notNull(),
		avatar_url: varchar('avatar_url', { length: 191 }),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		email: varchar({ length: 191 }),
		github_id: int('github_id').notNull(),
		updated_at: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
		username: varchar({ length: 191 }),
		theme: varchar({ length: 191 }).default('system').notNull(),
		name: varchar({ length: 191 }),
		twitter: varchar({ length: 191 })
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'User_id' }),
		unique('User_github_id_key').on(table.github_id),
		unique('User_email_key').on(table.email)
	]
);

export const userRole = mysqlTable(
	'UserRole',
	{
		id: varchar({ length: 191 }).notNull(),
		user_id: varchar({ length: 191 }).notNull(),
		role_id: varchar({ length: 191 }).notNull()
	},
	(table) => [
		index('UserRole_userId_idx').on(table.user_id),
		index('UserRole_roleId_idx').on(table.role_id),
		primaryKey({ columns: [table.id], name: 'UserRole_id' }),
		unique('UserRole_userId_roleId_key').on(table.user_id, table.role_id)
	]
);

export const userSubmission = mysqlTable(
	'UserSubmission',
	{
		id: varchar({ length: 191 }).notNull(),
		name: varchar({ length: 191 }),
		email: varchar({ length: 191 }),
		body: text().notNull(),
		created_at: datetime('created_at', { mode: 'string', fsp: 3 })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		updated_at: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
		audio_url: varchar('audio_url', { length: 191 }),
		status: mysqlEnum(['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'])
			.default('PENDING')
			.notNull(),
		submission_type: mysqlEnum('submission_type', [
			'POTLUCK',
			'SPOOKY',
			'GUEST',
			'FEEDBACK',
			'OTHER',
			'OSS'
		])
			.default('OTHER')
			.notNull()
	},
	(table) => [primaryKey({ columns: [table.id], name: 'UserSubmission_id' })]
);

export const video = mysqlTable(
	'Video',
	{
		id: varchar({ length: 191 }).notNull(),
		title: varchar({ length: 191 }).notNull(),
		description: text(),
		url: varchar({ length: 191 }).notNull(),
		published_at: datetime('published_at', { mode: 'string', fsp: 3 }).notNull(),
		thumbnail: varchar({ length: 191 }).notNull(),
		slug: varchar({ length: 191 }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.id], name: 'Video_id' }),
		unique('Video_slug_key').on(table.slug)
	]
);
