// TODO WES BOS Remove
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import DeepgramPkg from '@deepgram/sdk';
const { Deepgram } = DeepgramPkg;
import { prisma_client as prisma } from '../../hooks.server';
import { error } from '@sveltejs/kit';
import { keywords } from './fixes';
import { addFlaggerAudio } from './flagger';
import { save_transcript_to_db } from './transcripts';
import type { PrerecordedTranscriptionResponse } from '@deepgram/sdk/dist/types';
const deepgramApiKey = process.env.DEEPGRAM_SECRET;
if (!deepgramApiKey) {
	console.error('Please set the DEEPGRAM_SECRET environment variable.');
	process.exit(1);
}

// Initializes the Deepgram SDK
export const deepgramClient = new Deepgram(deepgramApiKey, 'api.deepgram.com');

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
	const showBuffer = await addFlaggerAudio(show);
	console.log(`Fetching transcript for show #${show.number} - ${show.title}...`);
	console.log(showBuffer);
	// const filePath = join(process.cwd(), 'temp-transcript.json');
	const transcript: PrerecordedTranscriptionResponse = await deepgramClient.transcription
		.preRecorded(
			{
				buffer: showBuffer,
				mimetype: 'audio/mpeg'
			},
			{
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
			}
		)
		.catch((e) => {
			console.log(`Error fetching transcript for show #${show.number} - ${show.title}.`);
			console.log(e);
		});
	// Temp: Write to disk as temp-transcript.json
	// const transcript = JSON.parse(await readFile(filePath, 'utf-8'));
	// await writeFile(filePath, JSON.stringify(transcript, null, 2));
	console.log(`Transcript for show #${show.number} - ${show.title} fetched.`);
	await save_transcript_to_db(show, transcript.results?.utterances || []);

	// await writeFile(filePath, JSON.stringify(transcript, null, 2));
	console.log(`Transcript for show #${show.number} - ${show.title} saved.`);
}
