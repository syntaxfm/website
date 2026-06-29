import { db } from '$server/db/client';
import {
	show as shows,
	transcript as transcripts,
	transcriptUtterance as transcriptUtterances,
	transcriptUtteranceWord as transcriptUtteranceWords,
	aiShowNote as aiShowNotes,
	aiSummaryEntry as aiSummaryEntries,
	aiTweet as aiTweets,
	link as links,
	aiGuest as aiGuests,
	topic as topics
} from '$server/db/schema';
import { desc, inArray } from 'drizzle-orm';

export async function content() {
	// Last 20 Shows
	const Show = await db.query.show.findMany({
		orderBy: [desc(shows.number)]
	});

	// ShowGuest
	const ShowGuest = await db.query.showGuest.findMany();
	// Guest
	const Guest = await db.query.guest.findMany();
	// SocialLink
	const SocialLink = await db.query.socialLink.findMany();

	const twenty_recent_shows = Show.slice(0, 20);
	const SHOW_NUMBERS = twenty_recent_shows.map((show) => show.number);

	// Transcript
	const Transcript = await db.query.transcript.findMany({
		where: inArray(transcripts.show_number, SHOW_NUMBERS)
	});

	const TRANSCRIPT_IDS = Transcript.map((transcript) => transcript.id);

	// TranscriptUtterance
	const TranscriptUtterance = await db.query.transcriptUtterance.findMany({
		where: inArray(transcriptUtterances.transcript_id, TRANSCRIPT_IDS)
	});

	const TRANSCRIPT_UTTERANCE_IDS = TranscriptUtterance.map((transcript) => transcript.id);

	// TranscriptUtteranceWord
	const TranscriptUtteranceWord = await db.query.transcriptUtteranceWord.findMany({
		where: inArray(transcriptUtteranceWords.transcript_utterance_id, TRANSCRIPT_UTTERANCE_IDS)
	});

	// AiShowNote
	const AiShowNote = await db.query.aiShowNote.findMany({
		where: inArray(aiShowNotes.show_number, SHOW_NUMBERS)
	});

	const SHOW_NOTE_ID = AiShowNote.map((note) => note.id);

	// AiSummaryEntry
	const AiSummaryEntry = await db.query.aiSummaryEntry.findMany({
		where: inArray(aiSummaryEntries.show_note_id, SHOW_NOTE_ID)
	});

	// AiTweet
	const AiTweet = await db.query.aiTweet.findMany({
		where: inArray(aiTweets.show_note_id, SHOW_NOTE_ID)
	});

	// Link
	const Link = await db.query.link.findMany({
		where: inArray(links.show_note_id, SHOW_NOTE_ID)
	});

	// AiGuest
	const AiGuest = await db.query.aiGuest.findMany({
		where: inArray(aiGuests.show_note_id, SHOW_NOTE_ID)
	});

	// Topic
	const Topic = await db.query.topic.findMany({
		where: inArray(topics.show_note_id, SHOW_NOTE_ID)
	});

	return {
		Show,
		ShowGuest,
		Guest,
		SocialLink,
		Transcript,
		TranscriptUtterance,
		TranscriptUtteranceWord,
		AiShowNote,
		AiSummaryEntry,
		AiTweet,
		Link,
		AiGuest,
		Topic
	};
}
