import { prisma_client } from '#server/prisma-client.js';

export async function content() {
	// Last 20 Shows
	const show = await prisma_client.show.findMany({
		orderBy: { number: 'desc' }
	});

	// ShowGuest
	const show_guest = await prisma_client.showGuest.findMany();
	// Guest
	const guest = await prisma_client.guest.findMany();
	// SocialLink
	const social_link = await prisma_client.socialLink.findMany();

	const twenty_recent_shows = show.slice(0, 20);
	const SHOW_NUMBERS = twenty_recent_shows.map((show) => show.number);

	// Transcript
	const transcript = await prisma_client.transcript.findMany({
		where: {
			show_number: {
				in: SHOW_NUMBERS
			}
		}
	});

	const TRANSCRIPT_IDS = transcript.map((transcript) => transcript.id);

	// TranscriptUtterance
	const transcript_utterance = await prisma_client.transcriptUtterance.findMany({
		where: {
			transcriptId: {
				in: TRANSCRIPT_IDS
			}
		}
	});

	const TRANSCRIPT_UTTERANCE_IDS = transcript_utterance.map((transcript) => transcript.id);

	// TranscriptUtteranceWord
	const transcript_utterance_word = await prisma_client.transcriptUtteranceWord.findMany({
		where: {
			transcriptUtteranceId: {
				in: TRANSCRIPT_UTTERANCE_IDS
			}
		}
	});

	// AiShowNote
	const ai_show_note = await prisma_client.aiShowNote.findMany({
		where: {
			show_number: {
				in: SHOW_NUMBERS
			}
		}
	});
	const SHOW_NOTE_ID = ai_show_note.map((note) => note.id);

	// AiSummaryEntry
	const ai_summary_entry = await prisma_client.aiSummaryEntry.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// AiTweet
	const ai_tweet = await prisma_client.aiTweet.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// Link
	const link = await prisma_client.link.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	// AiGuest
	const ai_guest = await prisma_client.aiGuest.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});
	// Topic
	const topic = await prisma_client.topic.findMany({
		where: {
			showNote: {
				in: SHOW_NOTE_ID
			}
		}
	});

	return {
		Show: show,
		ShowGuest: show_guest,
		Guest: guest,
		SocialLink: social_link,
		Transcript: transcript,
		TranscriptUtterance: transcript_utterance,
		TranscriptUtteranceWord: transcript_utterance_word,
		AiShowNote: ai_show_note,
		AiSummaryEntry: ai_summary_entry,
		AiTweet: ai_tweet,
		Link: link,
		AiGuest: ai_guest,
		Topic: topic
	};
}
