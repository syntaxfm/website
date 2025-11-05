import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, varchar, datetime, text, int, index, unique, tinyint, mysqlEnum, double } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const prismaMigrations = mysqlTable("_prisma_migrations", {
	id: varchar({ length: 36 }).notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: datetime("finished_at", { mode: 'string', fsp: 3 }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: datetime("rolled_back_at", { mode: 'string', fsp: 3 }),
	startedAt: datetime("started_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	appliedStepsCount: int("applied_steps_count", { unsigned: true }).default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "_prisma_migrations_id"}),
]);

export const showToUser = mysqlTable("_ShowToUser", {
	a: varchar("A", { length: 191 }).notNull(),
	b: varchar("B", { length: 191 }).notNull(),
},
(table) => [
	index("_ShowToUser_B_index").on(table.b),
	unique("_ShowToUser_AB_unique").on(table.a, table.b),
]);

export const aiGuest = mysqlTable("AiGuest", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 191 }).notNull(),
	showNote: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "AiGuest_id"}),
]);

/**
 * @deprecated No longer used
 */
export const aiShowNote = mysqlTable("AiShowNote", {
	id: int().autoincrement().notNull(),
	showNumber: int("show_number").notNull(),
	title: varchar({ length: 191 }).notNull(),
	description: varchar({ length: 1500 }).notNull(),
	provider: varchar({ length: 191 }).default('gpt3.5').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "AiShowNote_id"}),
	unique("AiShowNote_show_number_key").on(table.showNumber),
]);

/**
 * @deprecated No longer used
 */
export const aiSummaryEntry = mysqlTable("AiSummaryEntry", {
	id: int().autoincrement().notNull(),
	time: varchar({ length: 191 }).notNull(),
	text: varchar({ length: 191 }).notNull(),
	description: varchar({ length: 191 }),
	showNote: int().notNull(),
},
(table) => [
	index("AiSummaryEntry_showNote_idx").on(table.showNote),
	primaryKey({ columns: [table.id], name: "AiSummaryEntry_id"}),
]);

export const aiTweet = mysqlTable("AiTweet", {
	id: int().autoincrement().notNull(),
	content: varchar({ length: 350 }).notNull(),
	showNote: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "AiTweet_id"}),
]);

export const guest = mysqlTable("Guest", {
	id: varchar({ length: 191 }).notNull(),
	name: varchar({ length: 191 }).notNull(),
	nameSlug: varchar("name_slug", { length: 191 }).notNull(),
	twitter: varchar({ length: 191 }),
	github: varchar({ length: 191 }),
	url: varchar({ length: 191 }),
	of: varchar({ length: 191 }).default('),
},
(table) => [
	index("Guest_name_idx").on(table.name),
	primaryKey({ columns: [table.id], name: "Guest_id"}),
	unique("Guest_name_slug_key").on(table.nameSlug),
	unique("Guest_twitter_key").on(table.twitter),
	unique("Guest_github_key").on(table.github),
]);

export const link = mysqlTable("Link", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 191 }).notNull(),
	url: varchar({ length: 191 }).notNull(),
	timestamp: varchar({ length: 191 }),
	showNote: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Link_id"}),
]);

export const playlist = mysqlTable("Playlist", {
	id: varchar({ length: 191 }).notNull(),
	title: varchar({ length: 191 }).notNull(),
	description: text(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	slug: varchar({ length: 191 }).notNull(),
	unlisted: tinyint(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Playlist_id"}),
	unique("Playlist_slug_key").on(table.slug),
]);

export const playlistOnVideo = mysqlTable("PlaylistOnVideo", {
	videoId: varchar("video_id", { length: 191 }).notNull(),
	playlistId: varchar("playlist_id", { length: 191 }).notNull(),
	order: int().notNull(),
},
(table) => [
	index("PlaylistOnVideo_video_id_idx").on(table.videoId),
	index("PlaylistOnVideo_playlist_id_idx").on(table.playlistId),
	primaryKey({ columns: [table.videoId, table.playlistId], name: "PlaylistOnVideo_video_id_playlist_id"}),
	unique("PlaylistOnVideo_video_id_playlist_id_key").on(table.videoId, table.playlistId),
]);

export const remotePlaylist = mysqlTable("RemotePlaylist", {
	playlistId: varchar("playlist_id", { length: 191 }).notNull(),
	title: varchar({ length: 191 }).notNull(),
	videosCount: int("videos_count").notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.playlistId], name: "RemotePlaylist_playlist_id"}),
]);

export const role = mysqlTable("Role", {
	id: varchar({ length: 191 }).notNull(),
	name: varchar({ length: 191 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Role_id"}),
	unique("Role_name_key").on(table.name),
]);

export const session = mysqlTable("Session", {
	id: int().autoincrement().notNull(),
	userId: varchar("user_id", { length: 191 }),
	accessToken: varchar("access_token", { length: 191 }),
	sessionToken: varchar("session_token", { length: 191 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).notNull(),
	ip: varchar({ length: 191 }),
	country: varchar({ length: 191 }),
},
(table) => [
	index("Session_user_id_idx").on(table.userId),
	primaryKey({ columns: [table.id], name: "Session_id"}),
	unique("Session_session_token_key").on(table.sessionToken),
	unique("Session_access_token_key").on(table.accessToken),
]);

export const show = mysqlTable("Show", {
	id: varchar({ length: 191 }).notNull(),
	number: int().notNull(),
	title: text().notNull(),
	date: datetime({ mode: 'string', fsp: 3 }).notNull(),
	url: varchar({ length: 191 }).notNull(),
	showNotes: text("show_notes").notNull(),
	hash: varchar({ length: 191 }).notNull(),
	slug: varchar({ length: 191 }).notNull(),
	mdFile: varchar("md_file", { length: 191 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).notNull(),
	showType: mysqlEnum("show_type", ['HASTY','TASTY','SUPPER','SPECIAL']).default('SPECIAL').notNull(),
	youtubeUrl: varchar("youtube_url", { length: 191 }),
	spotifyId: varchar("spotify_id", { length: 191 }),
},
(table) => [
	index("idx_show_number_date").on(table.number, table.date),
	index("Show_number_idx").on(table.number),
	primaryKey({ columns: [table.id], name: "Show_id"}),
	unique("Show_number_key").on(table.number),
	unique("Show_hash_key").on(table.hash),
	unique("Show_md_file_key").on(table.mdFile),
]);

export const showGuest = mysqlTable("ShowGuest", {
	id: varchar({ length: 191 }).notNull(),
	showId: varchar({ length: 191 }).notNull(),
	guestId: varchar({ length: 191 }).notNull(),
	transcriptId: varchar({ length: 191 }),
},
(table) => [
	index("ShowGuest_transcriptId_idx").on(table.transcriptId),
	index("ShowGuest_guestId_idx").on(table.guestId),
	primaryKey({ columns: [table.id], name: "ShowGuest_id"}),
	unique("ShowGuest_showId_guestId_key").on(table.showId, table.guestId),
]);

export const showVideo = mysqlTable("ShowVideo", {
	showId: varchar({ length: 191 }).notNull(),
	videoId: varchar({ length: 191 }).notNull(),
},
(table) => [
	index("ShowVideo_showId_idx").on(table.showId),
	index("ShowVideo_videoId_idx").on(table.videoId),
	primaryKey({ columns: [table.showId, table.videoId], name: "ShowVideo_showId_videoId"}),
]);

export const socialLink = mysqlTable("SocialLink", {
	id: varchar({ length: 191 }).notNull(),
	link: varchar({ length: 191 }).notNull(),
	guestId: varchar("guest_id", { length: 191 }).notNull(),
},
(table) => [
	index("SocialLink_guest_id_idx").on(table.guestId),
	primaryKey({ columns: [table.id], name: "SocialLink_id"}),
	unique("SocialLink_link_guest_id_key").on(table.link, table.guestId),
]);

export const topic = mysqlTable("Topic", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 191 }).notNull(),
	showNote: int().notNull(),
},
(table) => [
	index("Topic_showNote_idx").on(table.showNote),
	primaryKey({ columns: [table.id], name: "Topic_id"}),
]);

export const transcript = mysqlTable("Transcript", {
	id: varchar({ length: 191 }).notNull(),
	showNumber: int("show_number").notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Transcript_id"}),
	unique("Transcript_show_number_key").on(table.showNumber),
]);

export const transcriptUtterance = mysqlTable("TranscriptUtterance", {
	id: varchar({ length: 191 }).notNull(),
	start: double().notNull(),
	end: double().notNull(),
	confidence: double().notNull(),
	channel: int().notNull(),
	transcriptValue: text("transcript_value").notNull(),
	speaker: int().notNull(),
	speakerName: varchar({ length: 191 }),
	transcriptId: varchar({ length: 191 }).notNull(),
},
(table) => [
	index("TranscriptUtterance_transcriptId_idx").on(table.transcriptId),
	primaryKey({ columns: [table.id], name: "TranscriptUtterance_id"}),
]);

export const transcriptUtteranceWord = mysqlTable("TranscriptUtteranceWord", {
	id: varchar({ length: 191 }).notNull(),
	word: varchar({ length: 191 }).notNull(),
	start: double().notNull(),
	end: double().notNull(),
	confidence: double().notNull(),
	speaker: int().notNull(),
	speakerConfidence: double("speaker_confidence").notNull(),
	punctuatedWord: varchar("punctuated_word", { length: 191 }).notNull(),
	transcriptUtteranceId: varchar({ length: 191 }).notNull(),
},
(table) => [
	index("TranscriptUtteranceWord_transcriptUtteranceId_idx").on(table.transcriptUtteranceId),
	primaryKey({ columns: [table.id], name: "TranscriptUtteranceWord_id"}),
]);

export const user = mysqlTable("User", {
	id: varchar({ length: 191 }).notNull(),
	avatarUrl: varchar("avatar_url", { length: 191 }),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	email: varchar({ length: 191 }),
	githubId: int("github_id").notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).notNull(),
	username: varchar({ length: 191 }),
	theme: varchar({ length: 191 }).default('system').notNull(),
	name: varchar({ length: 191 }),
	twitter: varchar({ length: 191 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "User_id"}),
	unique("User_github_id_key").on(table.githubId),
	unique("User_email_key").on(table.email),
]);

export const userRole = mysqlTable("UserRole", {
	id: varchar({ length: 191 }).notNull(),
	userId: varchar({ length: 191 }).notNull(),
	roleId: varchar({ length: 191 }).notNull(),
},
(table) => [
	index("UserRole_userId_idx").on(table.userId),
	index("UserRole_roleId_idx").on(table.roleId),
	primaryKey({ columns: [table.id], name: "UserRole_id"}),
	unique("UserRole_userId_roleId_key").on(table.userId, table.roleId),
]);

export const userSubmission = mysqlTable("UserSubmission", {
	id: varchar({ length: 191 }).notNull(),
	name: varchar({ length: 191 }),
	email: varchar({ length: 191 }),
	body: text().notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).notNull(),
	audioUrl: varchar("audio_url", { length: 191 }),
	status: mysqlEnum(['PENDING','APPROVED','COMPLETED','REJECTED']).default('PENDING').notNull(),
	submissionType: mysqlEnum("submission_type", ['POTLUCK','SPOOKY','GUEST','FEEDBACK','OTHER','OSS']).default('OTHER').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "UserSubmission_id"}),
]);

export const video = mysqlTable("Video", {
	id: varchar({ length: 191 }).notNull(),
	title: varchar({ length: 191 }).notNull(),
	description: text(),
	url: varchar({ length: 191 }).notNull(),
	publishedAt: datetime("published_at", { mode: 'string', fsp: 3 }).notNull(),
	thumbnail: varchar({ length: 191 }).notNull(),
	slug: varchar({ length: 191 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Video_id"}),
	unique("Video_slug_key").on(table.slug),
]);
