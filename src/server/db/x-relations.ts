import { relations } from 'drizzle-orm';
import {
	aiGuest,
	aiShowNote,
	aiSummaryEntry,
	aiTweet,
	guest,
	link,
	playlist,
	playlistOnVideo,
	role,
	session,
	show,
	show_guest,
	showVideo,
	socialLink,
	topic,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord,
	user,
	userRole,
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
		fields: [aiGuest.show_note],
		references: [aiShowNote.id]
	})
}));

export const aiSummaryEntryRelations = relations(aiSummaryEntry, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [aiSummaryEntry.show_note],
		references: [aiShowNote.id]
	})
}));

export const aiTweetRelations = relations(aiTweet, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [aiTweet.show_note],
		references: [aiShowNote.id]
	})
}));

export const linkRelations = relations(link, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [link.show_note],
		references: [aiShowNote.id]
	})
}));

export const topicRelations = relations(topic, ({ one }) => ({
	aiShowNote: one(aiShowNote, {
		fields: [topic.show_note],
		references: [aiShowNote.id]
	})
}));

// ============================================================================
// GUEST RELATIONS
// ============================================================================

export const guestRelations = relations(guest, ({ many }) => ({
	socialLinks: many(socialLink),
	show_guests: many(show_guest)
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

export const show_relations = relations(show, ({ many }) => ({
	guests: many(show_guest)
}));

export const show_guest_relations = relations(show_guest, ({ one }) => ({
	show: one(show, {
		fields: [show_guest.show_id],
		references: [show.id]
	}),
	guest: one(guest, {
		fields: [show_guest.guest_id],
		references: [guest.id]
	})
}));

export const guest_relations = relations(guest, ({ many }) => ({
	shows: many(show_guest)
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
	show_guests: many(show_guest)
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

export const videoRelations = relations(video, ({ many }) => ({
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
	userRoles: many(userRole)
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
