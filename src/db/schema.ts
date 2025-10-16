import { relations } from 'drizzle-orm';
import {
	mysqlTable,
	varchar,
	text,
	datetime,
	int,
	float,
	boolean,
	mysqlEnum,
	unique,
	index,
	primaryKey
} from 'drizzle-orm/mysql-core';

// No need to pre-define enums in Drizzle - they're defined inline in the table

// User Table
export const users = mysqlTable('User', {
	id: varchar('id', { length: 191 }).primaryKey(),
	avatar_url: varchar('avatar_url', { length: 255 }),
	created_at: datetime('created_at').notNull().default(new Date()),
	email: varchar('email', { length: 191 }),
	github_id: int('github_id').notNull().unique(),
	updated_at: datetime('updated_at').notNull(),
	username: varchar('username', { length: 191 }),
	theme: varchar('theme', { length: 50 }).notNull().default('system'),
	name: varchar('name', { length: 191 }),
	twitter: varchar('twitter', { length: 191 })
});

// Role Table
export const roles = mysqlTable('Role', {
	id: varchar('id', { length: 191 }).primaryKey(),
	name: varchar('name', { length: 191 }).notNull().unique()
});

// UserRole Table (Many-to-Many)
export const userRoles = mysqlTable(
	'UserRole',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		userId: varchar('userId', { length: 191 }).notNull(),
		roleId: varchar('roleId', { length: 191 }).notNull()
	},
	(table) => ({
		userIdIdx: index('UserRole_userId_idx').on(table.userId),
		roleIdIdx: index('UserRole_roleId_idx').on(table.roleId),
		uniqueUserRole: unique('UserRole_userId_roleId_key').on(table.userId, table.roleId)
	})
);

// Session Table
export const sessions = mysqlTable(
	'Session',
	{
		id: int('id').primaryKey().autoincrement(),
		user_id: varchar('user_id', { length: 191 }),
		access_token: varchar('access_token', { length: 255 }).unique(),
		session_token: varchar('session_token', { length: 255 }).notNull().unique(),
		created_at: datetime('created_at').notNull().default(new Date()),
		updated_at: datetime('updated_at').notNull(),
		ip: varchar('ip', { length: 45 }),
		country: varchar('country', { length: 100 })
	},
	(table) => ({
		userIdIdx: index('Session_user_id_idx').on(table.user_id)
	})
);

// Guest Table
export const guests = mysqlTable(
	'Guest',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		name: varchar('name', { length: 191 }).notNull(),
		name_slug: varchar('name_slug', { length: 191 }).notNull().unique(),
		twitter: varchar('twitter', { length: 191 }).unique(),
		github: varchar('github', { length: 191 }).unique(),
		of: varchar('of', { length: 255 }).default(''),
		url: varchar('url', { length: 255 })
	},
	(table) => ({
		nameIdx: index('Guest_name_idx').on(table.name)
	})
);

// SocialLink Table
export const socialLinks = mysqlTable(
	'SocialLink',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		link: varchar('link', { length: 255 }).notNull(),
		guest_id: varchar('guest_id', { length: 191 }).notNull()
	},
	(table) => ({
		guestIdIdx: index('SocialLink_guest_id_idx').on(table.guest_id),
		uniqueLinkGuest: unique('SocialLink_link_guest_id_key').on(table.link, table.guest_id)
	})
);

// Show Table
export const shows = mysqlTable(
	'Show',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		number: int('number').notNull().unique(),
		title: text('title').notNull(),
		date: datetime('date').notNull(),
		url: varchar('url', { length: 255 }).notNull(),
		youtube_url: varchar('youtube_url', { length: 255 }),
		show_notes: text('show_notes').notNull(),
		hash: varchar('hash', { length: 191 }).notNull().unique(),
		slug: varchar('slug', { length: 191 }).notNull(),
		md_file: varchar('md_file', { length: 255 }).notNull().unique(),
		created_at: datetime('created_at').notNull().default(new Date()),
		updated_at: datetime('updated_at').notNull(),
		show_type: mysqlEnum('show_type', ['HASTY', 'TASTY', 'SUPPER', 'SPECIAL'])
			.default('SPECIAL')
			.notNull()
	},
	(table) => ({
		numberDateIdx: index('idx_show_number_date').on(table.number, table.date),
		numberIdx: index('Show_number_idx').on(table.number)
	})
);

// ShowGuest Table (Many-to-Many)
export const showGuests = mysqlTable(
	'ShowGuest',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		showId: varchar('showId', { length: 191 }).notNull(),
		guestId: varchar('guestId', { length: 191 }).notNull(),
		transcriptId: varchar('transcriptId', { length: 191 })
	},
	(table) => ({
		guestIdIdx: index('ShowGuest_guestId_idx').on(table.guestId),
		transcriptIdIdx: index('ShowGuest_transcriptId_idx').on(table.transcriptId),
		uniqueShowGuest: unique('ShowGuest_showId_guestId_key').on(table.showId, table.guestId)
	})
);

// Transcript Table
export const transcripts = mysqlTable('Transcript', {
	id: varchar('id', { length: 191 }).primaryKey(),
	show_number: int('show_number').notNull().unique()
});

// TranscriptUtterance Table
export const transcriptUtterances = mysqlTable(
	'TranscriptUtterance',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		start: float('start').notNull(),
		end: float('end').notNull(),
		confidence: float('confidence').notNull(),
		channel: int('channel').notNull(),
		transcript_value: text('transcript_value').notNull(),
		speaker: int('speaker').notNull(),
		speakerName: varchar('speakerName', { length: 191 }),
		transcriptId: varchar('transcriptId', { length: 191 }).notNull()
	},
	(table) => ({
		transcriptIdIdx: index('TranscriptUtterance_transcriptId_idx').on(table.transcriptId)
	})
);

// TranscriptUtteranceWord Table
export const transcriptUtteranceWords = mysqlTable(
	'TranscriptUtteranceWord',
	{
		id: varchar('id', { length: 191 }).primaryKey(),
		word: varchar('word', { length: 191 }).notNull(),
		start: float('start').notNull(),
		end: float('end').notNull(),
		confidence: float('confidence').notNull(),
		speaker: int('speaker').notNull(),
		speaker_confidence: float('speaker_confidence').notNull(),
		punctuated_word: varchar('punctuated_word', { length: 191 }).notNull(),
		transcriptUtteranceId: varchar('transcriptUtteranceId', { length: 191 }).notNull()
	},
	(table) => ({
		utteranceIdIdx: index('TranscriptUtteranceWord_transcriptUtteranceId_idx').on(
			table.transcriptUtteranceId
		)
	})
);

// AiShowNote Table
export const aiShowNotes = mysqlTable('AiShowNote', {
	id: int('id').primaryKey().autoincrement(),
	show_number: int('show_number').notNull().unique(),
	title: varchar('title', { length: 255 }).notNull(),
	description: varchar('description', { length: 1500 }).notNull(),
	provider: varchar('provider', { length: 50 }).notNull().default('gpt3.5')
});

// AiSummaryEntry Table
export const aiSummaryEntries = mysqlTable(
	'AiSummaryEntry',
	{
		id: int('id').primaryKey().autoincrement(),
		time: varchar('time', { length: 50 }).notNull(),
		text: varchar('text', { length: 255 }).notNull(),
		description: varchar('description', { length: 255 }),
		showNote: int('showNote').notNull()
	},
	(table) => ({
		showNoteIdx: index('AiSummaryEntry_showNote_idx').on(table.showNote)
	})
);

// AiTweet Table
export const aiTweets = mysqlTable('AiTweet', {
	id: int('id').primaryKey().autoincrement(),
	content: varchar('content', { length: 350 }).notNull(),
	showNote: int('showNote').notNull()
});

// Link Table
export const links = mysqlTable('Link', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 255 }).notNull(),
	url: varchar('url', { length: 255 }).notNull(),
	timestamp: varchar('timestamp', { length: 50 }),
	showNote: int('showNote').notNull()
});

// AiGuest Table
export const aiGuests = mysqlTable('AiGuest', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 255 }).notNull(),
	showNote: int('showNote').notNull()
});

// Topic Table
export const topics = mysqlTable(
	'Topic',
	{
		id: int('id').primaryKey().autoincrement(),
		name: varchar('name', { length: 255 }).notNull(),
		showNote: int('showNote').notNull()
	},
	(table) => ({
		showNoteIdx: index('Topic_showNote_idx').on(table.showNote)
	})
);

// Video Table
export const videos = mysqlTable('Video', {
	id: varchar('id', { length: 191 }).primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	url: varchar('url', { length: 255 }).notNull(),
	published_at: datetime('published_at').notNull(),
	thumbnail: varchar('thumbnail', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 191 }).notNull().unique()
});

// Playlist Table
export const playlists = mysqlTable('Playlist', {
	id: varchar('id', { length: 191 }).primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	created_at: datetime('created_at').notNull().default(new Date()),
	slug: varchar('slug', { length: 191 }).notNull().unique(),
	unlisted: boolean('unlisted').default(false)
});

// PlaylistOnVideo Table (Many-to-Many with order)
export const playlistsOnVideos = mysqlTable(
	'PlaylistOnVideo',
	{
		video_id: varchar('video_id', { length: 191 }).notNull(),
		playlist_id: varchar('playlist_id', { length: 191 }).notNull(),
		order: int('order').notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.video_id, table.playlist_id] }),
		videoIdIdx: index('PlaylistOnVideo_video_id_idx').on(table.video_id),
		playlistIdIdx: index('PlaylistOnVideo_playlist_id_idx').on(table.playlist_id),
		uniqueVideoPlaylist: unique('PlaylistOnVideo_video_id_playlist_id_key').on(
			table.video_id,
			table.playlist_id
		)
	})
);

// RemotePlaylist Table
export const remotePlaylists = mysqlTable('RemotePlaylist', {
	playlist_id: varchar('playlist_id', { length: 191 }).primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	videos_count: int('videos_count').notNull(),
	created_at: datetime('created_at').notNull()
});

// ShowVideo Table (Many-to-Many)
export const showVideos = mysqlTable(
	'ShowVideo',
	{
		showId: varchar('showId', { length: 191 }).notNull(),
		videoId: varchar('videoId', { length: 191 }).notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.showId, table.videoId] }),
		showIdIdx: index('ShowVideo_showId_idx').on(table.showId),
		videoIdIdx: index('ShowVideo_videoId_idx').on(table.videoId)
	})
);

// ShowHost Table (Many-to-Many junction table between Show and User)
// Prisma creates this implicitly as _ShowToUser
export const showHosts = mysqlTable(
	'_ShowToUser',
	{
		A: varchar('A', { length: 191 }).notNull(),
		B: varchar('B', { length: 191 }).notNull()
	},
	(t) => [
		primaryKey({ columns: [t.A, t.B] }),
		unique('_ShowToUser_AB_unique').on(t.A, t.B),
		index('_ShowToUser_B_index').on(t.B)
	]
);

// UserSubmission Table
export const userSubmissions = mysqlTable('UserSubmission', {
	id: varchar('id', { length: 191 }).primaryKey(),
	name: varchar('name', { length: 191 }),
	email: varchar('email', { length: 191 }),
	body: text('body').notNull(),
	created_at: datetime('created_at').notNull().default(new Date()),
	updated_at: datetime('updated_at').notNull(),
	audio_url: varchar('audio_url', { length: 255 }),
	status: mysqlEnum('status', ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'])
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
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	roles: many(userRoles),
	hostedShows: many(showHosts)
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	})
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.user_id],
		references: [users.id]
	})
}));

export const guestsRelations = relations(guests, ({ many }) => ({
	socialLinks: many(socialLinks),
	shows: many(showGuests)
}));

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
	guest: one(guests, {
		fields: [socialLinks.guest_id],
		references: [guests.id]
	})
}));

export const showsRelations = relations(shows, ({ many, one }) => ({
	guests: many(showGuests),
	transcript: one(transcripts, {
		fields: [shows.number],
		references: [transcripts.show_number]
	}),
	aiShowNote: one(aiShowNotes, {
		fields: [shows.number],
		references: [aiShowNotes.show_number]
	}),
	videos: many(showVideos),
	hosts: many(showHosts)
}));

export const showGuestsRelations = relations(showGuests, ({ one }) => ({
	show: one(shows, {
		fields: [showGuests.showId],
		references: [shows.id]
	}),
	guest: one(guests, {
		fields: [showGuests.guestId],
		references: [guests.id]
	}),
	transcript: one(transcripts, {
		fields: [showGuests.transcriptId],
		references: [transcripts.id]
	})
}));

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
	show: one(shows, {
		fields: [transcripts.show_number],
		references: [shows.number]
	}),
	utterances: many(transcriptUtterances),
	showGuests: many(showGuests)
}));

export const transcriptUtterancesRelations = relations(transcriptUtterances, ({ one, many }) => ({
	transcript: one(transcripts, {
		fields: [transcriptUtterances.transcriptId],
		references: [transcripts.id]
	}),
	words: many(transcriptUtteranceWords)
}));

export const transcriptUtteranceWordsRelations = relations(transcriptUtteranceWords, ({ one }) => ({
	utterance: one(transcriptUtterances, {
		fields: [transcriptUtteranceWords.transcriptUtteranceId],
		references: [transcriptUtterances.id]
	})
}));

export const aiShowNotesRelations = relations(aiShowNotes, ({ one, many }) => ({
	show: one(shows, {
		fields: [aiShowNotes.show_number],
		references: [shows.number]
	}),
	summary: many(aiSummaryEntries),
	tweets: many(aiTweets),
	links: many(links),
	guests: many(aiGuests),
	topics: many(topics)
}));

export const aiSummaryEntriesRelations = relations(aiSummaryEntries, ({ one }) => ({
	aiShowNote: one(aiShowNotes, {
		fields: [aiSummaryEntries.showNote],
		references: [aiShowNotes.id]
	})
}));

export const aiTweetsRelations = relations(aiTweets, ({ one }) => ({
	aiShowNote: one(aiShowNotes, {
		fields: [aiTweets.showNote],
		references: [aiShowNotes.id]
	})
}));

export const linksRelations = relations(links, ({ one }) => ({
	aiShowNote: one(aiShowNotes, {
		fields: [links.showNote],
		references: [aiShowNotes.id]
	})
}));

export const aiGuestsRelations = relations(aiGuests, ({ one }) => ({
	aiShowNote: one(aiShowNotes, {
		fields: [aiGuests.showNote],
		references: [aiShowNotes.id]
	})
}));

export const topicsRelations = relations(topics, ({ one }) => ({
	aiShowNote: one(aiShowNotes, {
		fields: [topics.showNote],
		references: [aiShowNotes.id]
	})
}));

export const videosRelations = relations(videos, ({ many }) => ({
	playlists: many(playlistsOnVideos),
	shows: many(showVideos)
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
	videos: many(playlistsOnVideos)
}));

export const playlistsOnVideosRelations = relations(playlistsOnVideos, ({ one }) => ({
	video: one(videos, {
		fields: [playlistsOnVideos.video_id],
		references: [videos.id]
	}),
	playlist: one(playlists, {
		fields: [playlistsOnVideos.playlist_id],
		references: [playlists.id]
	})
}));

export const showVideosRelations = relations(showVideos, ({ one }) => ({
	show: one(shows, {
		fields: [showVideos.showId],
		references: [shows.id]
	}),
	video: one(videos, {
		fields: [showVideos.videoId],
		references: [videos.id]
	})
}));

export const showHostsRelations = relations(showHosts, ({ one }) => ({
	show: one(shows, {
		fields: [showHosts.A],
		references: [shows.id]
	}),
	user: one(users, {
		fields: [showHosts.B],
		references: [users.id]
	})
}));
