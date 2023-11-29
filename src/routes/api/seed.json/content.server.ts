import { prisma_client } from '$/hooks.server';

export async function content() {
	// ShowGuest
	const ShowGuest = await prisma_client.showGuest.findMany();
	// Guest
	const Guest = await prisma_client.guest.findMany();
	// SocialLink
	const SocialLink = await prisma_client.socialLink.findMany();
	// Show
	const Show = await prisma_client.show.findMany();
	// Transcript
	const Transcript = await prisma_client.transcript.findMany();
	// TranscriptUtterance
	const TranscriptUtterance = await prisma_client.transcriptUtterance.findMany();
	// TranscriptUtteranceWord
	const TranscriptUtteranceWord = await prisma_client.transcriptUtteranceWord.findMany();
	// AiShowNote
	const AiShowNote = await prisma_client.aiShowNote.findMany();
	// AiSummaryEntry
	const AiSummaryEntry = await prisma_client.aiSummaryEntry.findMany();
	// AiTweet
	const AiTweet = await prisma_client.aiTweet.findMany();
	// Link
	const Link = await prisma_client.link.findMany();
	// AiGuest
	const AiGuest = await prisma_client.aiGuest.findMany();
	// Topic
	const Topic = await prisma_client.topic.findMany();

	return {
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
