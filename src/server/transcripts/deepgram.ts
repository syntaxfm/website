import { DeepgramClient } from '@deepgram/sdk';
import { prisma_client as prisma } from '#server/prisma-client.js';
import { error } from '@sveltejs/kit';
import { keywords } from './fixes';
import { addFlaggerAudio } from './flagger';
import { save_transcript_to_db } from './transcripts';

function get_deepgram_client() {
	const deepgram_api_key = process.env.DEEPGRAM_SECRET;
	if (!deepgram_api_key) {
		throw new Error('Please set the DEEPGRAM_SECRET environment variable.');
	}
	return new DeepgramClient({ apiKey: deepgram_api_key });
}

export async function get_transcript(showNumber: number) {
	const deepgram_client = get_deepgram_client();
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
		const transcript = await deepgram_client.listen.v1.media.transcribeFile(show_buffer, {
			punctuate: true,
			model: 'nova-3',
			language: 'en-US',
			detect_entities: true,
			diarize: true,
			smart_format: true,
			paragraphs: true, // Not very good
			utterances: true,
			keyterm: keywords
		});

		console.log(`Transcript for show #${show.number} - ${show.title} fetched.`);
		if (!('results' in transcript)) {
			throw new Error(`Deepgram returned no results for show #${show.number}.`);
		}
		await save_transcript_to_db(show, transcript.results.utterances ?? []);

		console.log(`Transcript for show #${show.number} - ${show.title} saved.`);
	} catch (e) {
		console.log(`Error fetching transcript for show #${show.number} - ${show.title}.`);
		console.log(e);
	}
}
