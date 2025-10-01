import { createClient } from '@deepgram/sdk';
import { prisma_client as prisma } from '$/server/prisma-client';
import { error } from '@sveltejs/kit';
import { keywords } from './fixes';
import { addFlaggerAudio } from './flagger';
import { save_transcript_to_db } from './transcripts';

const deepgram_api_key = process.env.DEEPGRAM_SECRET;
if (!deepgram_api_key) {
	console.error('Please set the DEEPGRAM_SECRET environment variable.');
	process.exit(1);
}

export const deepgram_client = createClient(deepgram_api_key);

export async function get_transcript(showNumber: number) {
	const show = await prisma.show.findUnique({
		where: { number: showNumber },
		include: {
			transcript: true
		}
	});

	if (!show) {
		error(500, `Show #${showNumber} not found.`);
	}
	if (show.transcript) {
		error(
			409,
			`Transcript for show #${show.number} already exists. Delete it if you want to re-fetch it.`
		);
	}
	const show_buffer = await addFlaggerAudio(show);
	console.log(`Fetching transcript for show #${show.number} - ${show.title}...`);

	try {
		const transcript = await deepgram_client.listen.prerecorded.transcribeFile(show_buffer, {
			punctuate: true,
			model: 'nova-2-ea',
			language: 'en-US',
			detect_entities: true,
			diarize: true,
			smart_format: true,
			paragraphs: true, // Not very good
			utterances: true,
			detect_topics: false, // not very good
			keywords
		});

		console.log(`Transcript for show #${show.number} - ${show.title} fetched.`);
		await save_transcript_to_db(show, transcript.result?.results.utterances || []);

		console.log(`Transcript for show #${show.number} - ${show.title} saved.`);
	} catch (e) {
		console.log(`Error fetching transcript for show #${show.number} - ${show.title}.`);
		console.log(e);
	}
}
