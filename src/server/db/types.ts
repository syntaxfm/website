import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';
import type { SUBMISSION_TYPE_VALUES } from './schema';

// Select types (for reading from database)
export type Article = InferSelectModel<typeof schema.article>;
export type ContentHost = InferSelectModel<typeof schema.contentHost>;
export type AiGuest = InferSelectModel<typeof schema.aiGuest>;
export type AiShowNote = InferSelectModel<typeof schema.aiShowNote>;
export type AiSummaryEntry = InferSelectModel<typeof schema.aiSummaryEntry>;
export type AiTweet = InferSelectModel<typeof schema.aiTweet>;
export type Content = InferSelectModel<typeof schema.content>;
export type Guest = InferSelectModel<typeof schema.guest>;
export type Link = InferSelectModel<typeof schema.link>;
export type Profile = InferSelectModel<typeof schema.profile>;
export type ProfileRole = InferSelectModel<typeof schema.profileRole>;
export type Role = InferSelectModel<typeof schema.role>;
export type Show = InferSelectModel<typeof schema.show>;
export type ContentGuest = InferSelectModel<typeof schema.contentGuest>;
export type SocialLink = InferSelectModel<typeof schema.socialLink>;
export type Topic = InferSelectModel<typeof schema.topic>;
export type Transcript = InferSelectModel<typeof schema.transcript>;
export type TranscriptUtterance = InferSelectModel<typeof schema.transcriptUtterance>;
export type TranscriptUtteranceWord = InferSelectModel<typeof schema.transcriptUtteranceWord>;
export type UserSubmission = InferSelectModel<typeof schema.userSubmission>;
export type Video = InferSelectModel<typeof schema.video>;

// Insert types (for creating/inserting into database)
export type InsertArticle = InferInsertModel<typeof schema.article>;
export type InsertContentHost = InferInsertModel<typeof schema.contentHost>;
export type InsertAiGuest = InferInsertModel<typeof schema.aiGuest>;
export type InsertAiShowNote = InferInsertModel<typeof schema.aiShowNote>;
export type InsertAiSummaryEntry = InferInsertModel<typeof schema.aiSummaryEntry>;
export type InsertAiTweet = InferInsertModel<typeof schema.aiTweet>;
export type InsertGuest = InferInsertModel<typeof schema.guest>;
export type InsertContent = InferInsertModel<typeof schema.content>;
export type InsertLink = InferInsertModel<typeof schema.link>;
export type InsertProfile = InferInsertModel<typeof schema.profile>;
export type InsertProfileRole = InferInsertModel<typeof schema.profileRole>;
export type InsertRole = InferInsertModel<typeof schema.role>;
export type InsertShow = InferInsertModel<typeof schema.show>;
export type InsertContentGuest = InferInsertModel<typeof schema.contentGuest>;
export type InsertSocialLink = InferInsertModel<typeof schema.socialLink>;
export type InsertTopic = InferInsertModel<typeof schema.topic>;
export type InsertTranscript = InferInsertModel<typeof schema.transcript>;
export type InsertTranscriptUtterance = InferInsertModel<typeof schema.transcriptUtterance>;
export type InsertTranscriptUtteranceWord = InferInsertModel<typeof schema.transcriptUtteranceWord>;
export type InsertUserSubmission = InferInsertModel<typeof schema.userSubmission>;
export type InsertVideo = InferInsertModel<typeof schema.video>;

export type Host = {
	name: string | null;
	username: string | null;
	twitter: string | null;
};

export type ShowWithHostsAndGuests = Show & { guests: { guest: Guest }[] } & {
	hosts: { profile: Host }[];
};

export type AllPossibleContent = Content & {
	show: ShowWithHostsAndGuests;
} & {
	article: Article;
} & {
	video: Video;
};

export type SubmissionTypes = (typeof SUBMISSION_TYPE_VALUES.enumValues)[number];
