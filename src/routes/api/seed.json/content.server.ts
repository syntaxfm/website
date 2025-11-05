import { db } from '$server/db/client';
import {
	shows,
	transcripts,
	transcriptUtterances,
	transcriptUtteranceWords,
	aiShowNotes,
	aiSummaryEntries,
	aiTweets,
	links,
	aiGuests,
	topics
} from '$server/db/schema';
import { desc, inArray } from 'drizzle-orm';

export async function content() {
	// Last 20 Shows
	const Show = await db.query.shows.findMany({
		orderBy: [desc(shows.number)]
	});

	// ShowGuest
	const ShowGuest = await db.query.showGuests.findMany();
	// Guest
	const Guest = await db.query.guests.findMany();
	// SocialLink
	const SocialLink = await db.query.socialLinks.findMany();

	const twenty_recent_shows = Show.slice(0, 20);
	const SHOW_NUMBERS = twenty_recent_shows.map((show) => show.number);

	// Transcript
	const Transcript = await db.query.transcripts.findMany({
		where: inArray(transcripts.show_number, SHOW_NUMBERS)
	});

	const TRANSCRIPT_IDS = Transcript.map((transcript) => transcript.id);

	// TranscriptUtterance
	const TranscriptUtterance = await db.query.transcriptUtterances.findMany({
		where: inArray(transcriptUtterances.transcriptId, TRANSCRIPT_IDS)
	});

	const TRANSCRIPT_UTTERANCE_IDS = TranscriptUtterance.map((transcript) => transcript.id);

	// TranscriptUtteranceWord
	const TranscriptUtteranceWord = await db.query.transcriptUtteranceWords.findMany({
		where: inArray(transcriptUtteranceWords.transcriptUtteranceId, TRANSCRIPT_UTTERANCE_IDS)
	});

	// AiShowNote
	const AiShowNote = await db.query.aiShowNotes.findMany({
		where: inArray(aiShowNotes.show_number, SHOW_NUMBERS)
	});

	const SHOW_NOTE_ID = AiShowNote.map((note) => note.id);

	// AiSummaryEntry
	const AiSummaryEntry = await db.query.aiSummaryEntries.findMany({
		where: inArray(aiSummaryEntries.showNote, SHOW_NOTE_ID)
	});

	// AiTweet
	const AiTweet = await db.query.aiTweets.findMany({
		where: inArray(aiTweets.showNote, SHOW_NOTE_ID)
	});

	// Link
	const Link = await db.query.links.findMany({
		where: inArray(links.showNote, SHOW_NOTE_ID)
	});

	// AiGuest
	const AiGuest = await db.query.aiGuests.findMany({
		where: inArray(aiGuests.showNote, SHOW_NOTE_ID)
	});

	// Topic
	const Topic = await db.query.topics.findMany({
		where: inArray(topics.showNote, SHOW_NOTE_ID)
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
