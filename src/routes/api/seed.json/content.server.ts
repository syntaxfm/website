import { prisma_client } from '$/server/prisma-client';

export async function content() {
	// Last 20 Shows
	const Show = await prisma_client.show.findMany({
		orderBy: { number: 'desc' }
	});

	// ShowGuest
	const ShowGuest = await prisma_client.showGuest.findMany();
	// Guest
	const Guest = await prisma_client.guest.findMany();
	// SocialLink
	const SocialLink = await prisma_client.socialLink.findMany();

	const twenty_recent_shows = Show.slice(0, 20);
	const SHOW_NUMBERS = twenty_recent_shows.map((show) => show.number);

	// Transcript
	const Transcript = await prisma_client.transcript.findMany({
		where: {
			show_number: {
				in: SHOW_NUMBERS
			}
		}
	});

	const TRANSCRIPT_IDS = Transcript.map((transcript) => transcript.id);

	// TranscriptUtterance
	const TranscriptUtterance = await prisma_client.transcriptUtterance.findMany({
		where: {
			transcriptId: {
				in: TRANSCRIPT_IDS
			}
		}
	});

	const TRANSCRIPT_UTTERANCE_IDS = TranscriptUtterance.map((transcript) => transcript.id);

	// TranscriptUtteranceWord
	const TranscriptUtteranceWord = await prisma_client.transcriptUtteranceWord.findMany({
		where: {
			transcriptUtteranceId: {
				in: TRANSCRIPT_UTTERANCE_IDS
			}
		}
	});

	// AiShowNote
	const AiShowNote = await prisma_client.aiShowNote.findMany({
		where: {
			show_number: {
				in: SHOW_NUMBERS
			}
		}
	});
	const SHOW_NOTE_ID = AiShowNote.map((note) => note.id);

	// AiSummaryEntry
	const AiSummaryEntry = await prisma_client.aiSummaryEntry.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// AiTweet
	const AiTweet = await prisma_client.aiTweet.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// Link
	const Link = await prisma_client.link.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// AiGuest
	const AiGuest = await prisma_client.aiGuest.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});
	// Topic
	const Topic = await prisma_client.topic.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
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
