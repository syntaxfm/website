import { relations } from 'drizzle-orm';
import {
	aiGuest,
	aiShowNote,
	aiSummaryEntry,
	aiTweet,
	article,
	content,
	content_tags,
	guest,
	link,
	playlist,
	playlistOnVideo,
	role,
	session,
	show,
	showGuest,
	showToUser,
	showVideo,
	socialLink,
	tag,
	topic,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord,
	user,
	userRole,
	userSubmission,
	video
} from './schema';

// ============================================================================
// AI SHOW NOTE RELATIONS
// ============================================================================

export const aiShowNoteRelations = relations(aiShowNote, ({ one, many }) => ({
	show: one(show, {
		fields: [aiShowNote.show_number],
		references: [show.number]
	}),
	guests: many(aiGuest),
	summary: many(aiSummaryEntry),
	tweets: many(aiTweet),
	links: many(link),
	topics: many(topic)
}));

export const aiGuestRelations = relations(aiGuest, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [aiGuest.show_note_id],
		references: [aiShowNote.id]
	})
}));

export const aiSummaryEntryRelations = relations(aiSummaryEntry, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [aiSummaryEntry.show_note_id],
		references: [aiShowNote.id]
	})
}));

export const aiTweetRelations = relations(aiTweet, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [aiTweet.show_note_id],
		references: [aiShowNote.id]
	})
}));

export const linkRelations = relations(link, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [link.show_note_id],
		references: [aiShowNote.id]
	})
}));

export const topicRelations = relations(topic, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [topic.show_note_id],
		references: [aiShowNote.id]
	})
}));

// ============================================================================
// GUEST RELATIONS
// ============================================================================

export const guestRelations = relations(guest, ({ many }) => ({
	socialLinks: many(socialLink),
	showGuests: many(showGuest)
}));

export const socialLinkRelations = relations(socialLink, ({ one }) => ({
	guest: one(guest, {
		fields: [socialLink.guest_id],
		references: [guest.id]
	})
}));

// ============================================================================
// SHOW RELATIONS
// ============================================================================

export const showRelations = relations(show, ({ one, many }) => ({
	meta: one(content, {
		fields: [show.content_id],
		references: [content.id]
	}),
	guests: many(showGuest),
	hosts: many(showToUser),
	videos: many(showVideo),
	transcript: one(transcript, {
		fields: [show.number],
		references: [transcript.show_number]
	}),
	aiShowNote: one(aiShowNote, {
		fields: [show.number],
		references: [aiShowNote.show_number]
	})
}));

export const showGuestRelations = relations(showGuest, ({ one }) => ({
	show: one(show, {
		fields: [showGuest.show_id],
		references: [show.id]
	}),
	guest: one(guest, {
		fields: [showGuest.guest_id],
		references: [guest.id]
	}),
	transcript: one(transcript, {
		fields: [showGuest.transcript_id],
		references: [transcript.id]
	})
}));

export const showToUserRelations = relations(showToUser, ({ one }) => ({
	show: one(show, {
		fields: [showToUser.show_id],
		references: [show.id]
	}),
	user: one(user, {
		fields: [showToUser.user_id],
		references: [user.id]
	})
}));

// ============================================================================
// TRANSCRIPT RELATIONS
// ============================================================================

export const transcriptRelations = relations(transcript, ({ one, many }) => ({
	show: one(show, {
		fields: [transcript.show_number],
		references: [show.number]
	}),
	utterances: many(transcriptUtterance),
	showGuests: many(showGuest)
}));

export const transcriptUtteranceRelations = relations(transcriptUtterance, ({ one, many }) => ({
	transcript: one(transcript, {
		fields: [transcriptUtterance.transcript_id],
		references: [transcript.id]
	}),
	words: many(transcriptUtteranceWord)
}));

export const transcriptUtteranceWordRelations = relations(transcriptUtteranceWord, ({ one }) => ({
	utterance: one(transcriptUtterance, {
		fields: [transcriptUtteranceWord.transcript_utterance_id],
		references: [transcriptUtterance.id]
	})
}));

// ============================================================================
// VIDEO & PLAYLIST RELATIONS
// ============================================================================

export const videoRelations = relations(video, ({ one, many }) => ({
	meta: one(content, {
		fields: [video.content_id],
		references: [content.id]
	}),
	playlists: many(playlistOnVideo),
	shows: many(showVideo)
}));

export const showVideoRelations = relations(showVideo, ({ one }) => ({
	show: one(show, {
		fields: [showVideo.show_id],
		references: [show.id]
	}),
	video: one(video, {
		fields: [showVideo.video_id],
		references: [video.id]
	})
}));

export const playlistRelations = relations(playlist, ({ many }) => ({
	videos: many(playlistOnVideo)
}));

export const playlistOnVideoRelations = relations(playlistOnVideo, ({ one }) => ({
	playlist: one(playlist, {
		fields: [playlistOnVideo.playlist_id],
		references: [playlist.id]
	}),
	video: one(video, {
		fields: [playlistOnVideo.video_id],
		references: [video.id]
	})
}));

// ============================================================================
// USER & AUTH RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	roles: many(userRole),
	hostedShows: many(showToUser)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.user_id],
		references: [user.id]
	})
}));

// ============================================================================
// ROLE RELATIONS
// ============================================================================

export const roleRelations = relations(role, ({ many }) => ({
	userRoles: many(userRole)
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
	user: one(user, {
		fields: [userRole.user_id],
		references: [user.id]
	}),
	role: one(role, {
		fields: [userRole.role_id],
		references: [role.id]
	})
}));

// ============================================================================
// CONTENT RELATIONS
// ============================================================================

export const contentRelations = relations(content, ({ one, many }) => ({
	article: one(article, {
		fields: [content.id],
		references: [article.content_id]
	}),
	show: one(show, {
		fields: [content.id],
		references: [show.content_id]
	}),
	video: one(video, {
		fields: [content.id],
		references: [video.content_id]
	}),
	tags: many(content_tags)
}));

export const articleRelations = relations(article, ({ one }) => ({
	meta: one(content, {
		fields: [article.content_id],
		references: [content.id]
	}),
	author: one(user, {
		fields: [article.author_id],
		references: [user.id]
	})
}));

// ============================================================================
// TAG RELATIONS
// ============================================================================

export const tagRelations = relations(tag, ({ many }) => ({
	contents: many(content_tags)
}));

export const contentTagsRelations = relations(content_tags, ({ one }) => ({
	content: one(content, {
		fields: [content_tags.content_id],
		references: [content.id]
	}),
	tag: one(tag, {
		fields: [content_tags.tag_id],
		references: [tag.id]
	})
}));
