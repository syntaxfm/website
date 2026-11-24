import { relations } from 'drizzle-orm';
import {
	aiGuest,
	aiShowNote,
	aiSummaryEntry,
	aiTweet,
	article,
	content,
	content_tags,
	contentGuest,
	contentHost,
	guest,
	link,
	newsletter_issue,
	profile,
	profileRole,
	role,
	show,
	socialLink,
	tag,
	topic,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord,
	video
} from './schema';

// ============================================================================
// AI SHOW NOTE RELATIONS
// ============================================================================

// Episodes, videos and their notes all link by content id, which never changes
export const aiShowNoteRelations = relations(aiShowNote, ({ one, many }) => ({
	show: one(show, {
		fields: [aiShowNote.content_id],
		references: [show.content_id]
	}),
	content: one(content, {
		fields: [aiShowNote.content_id],
		references: [content.id]
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
	// Every episode or video the guest is on
	appearances: many(contentGuest)
}));

export const contentGuestRelations = relations(contentGuest, ({ one }) => ({
	content: one(content, {
		fields: [contentGuest.content_id],
		references: [content.id]
	}),
	// The episode, when the content is one
	show: one(show, {
		fields: [contentGuest.content_id],
		references: [show.content_id]
	}),
	guest: one(guest, {
		fields: [contentGuest.guest_id],
		references: [guest.id]
	})
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
	guests: many(contentGuest),
	hosts: many(contentHost),
	transcript: one(transcript, {
		fields: [show.content_id],
		references: [transcript.content_id]
	}),
	aiShowNote: one(aiShowNote, {
		fields: [show.content_id],
		references: [aiShowNote.content_id]
	})
}));

export const contentHostRelations = relations(contentHost, ({ one }) => ({
	content: one(content, {
		fields: [contentHost.content_id],
		references: [content.id]
	}),
	// The episode, when the content is one
	show: one(show, {
		fields: [contentHost.content_id],
		references: [show.content_id]
	}),
	profile: one(profile, {
		fields: [contentHost.profile_id],
		references: [profile.id]
	})
}));

// ============================================================================
// TRANSCRIPT RELATIONS
// ============================================================================

export const transcriptRelations = relations(transcript, ({ one, many }) => ({
	show: one(show, {
		fields: [transcript.content_id],
		references: [show.content_id]
	}),
	content: one(content, {
		fields: [transcript.content_id],
		references: [content.id]
	}),
	utterances: many(transcriptUtterance)
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
// VIDEO RELATIONS
// ============================================================================

export const videoRelations = relations(video, ({ one }) => ({
	meta: one(content, {
		fields: [video.content_id],
		references: [content.id]
	})
}));

// ============================================================================
// PROFILE & AUTHORIZATION RELATIONS
// ============================================================================

export const profileRelations = relations(profile, ({ many }) => ({
	roles: many(profileRole),
	hosted: many(contentHost)
}));

// ============================================================================
// ROLE RELATIONS
// ============================================================================

export const roleRelations = relations(role, ({ many }) => ({
	profileRoles: many(profileRole)
}));

export const profileRoleRelations = relations(profileRole, ({ one }) => ({
	profile: one(profile, {
		fields: [profileRole.profile_id],
		references: [profile.id]
	}),
	role: one(role, {
		fields: [profileRole.role_id],
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
	transcript: one(transcript, {
		fields: [content.id],
		references: [transcript.content_id]
	}),
	aiShowNote: one(aiShowNote, {
		fields: [content.id],
		references: [aiShowNote.content_id]
	}),
	guests: many(contentGuest),
	hosts: many(contentHost),
	newsletter_issue: one(newsletter_issue, {
		fields: [content.id],
		references: [newsletter_issue.content_id]
	}),
	tags: many(content_tags)
}));

export const newsletterIssueRelations = relations(newsletter_issue, ({ one }) => ({
	meta: one(content, {
		fields: [newsletter_issue.content_id],
		references: [content.id]
	})
}));

export const articleRelations = relations(article, ({ one }) => ({
	meta: one(content, {
		fields: [article.content_id],
		references: [content.id]
	}),
	author: one(profile, {
		fields: [article.author_id],
		references: [profile.id]
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
