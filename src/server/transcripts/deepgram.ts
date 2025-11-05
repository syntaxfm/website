import { createClient } from '@deepgram/sdk';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { keywords } from './fixes';
import { addFlaggerAudio } from './flagger';
import { save_transcript_to_db } from './transcripts';
import { env } from '$env/dynamic/private';

const deepgram_api_key = env.DEEPGRAM_SECRET;
if (!deepgram_api_key) {
	console.error('Please set the DEEPGRAM_SECRET environment variable.');
	process.exit(1);
}

export const deepgram_client = createClient(deepgram_api_key);

export async function get_transcript(showNumber: number) {
	const active_show = await db.query.show.findFirst({
		where: eq(show.number, showNumber),
		// By default, {} would select all transcript columns. We only need to know if one exists,
		// so select just the id to avoid loading unnecessary data.
		with: {
			transcript: {
				columns: {
					id: true
				}
			}
		}
	});

	if (!active_show) {
		error(500, `Show #${showNumber} not found.`);
	}
	if (active_show.transcript) {
		error(
			409,
			`Transcript for show #${show.number} already exists. Delete it if you want to re-fetch it.`
		);
	}
	const show_buffer = await addFlaggerAudio(active_show);
	console.log(`Fetching transcript for show #${active_show.number} - ${active_show.title}...`);

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

		console.log(`Transcript for show #${active_show.number} - ${active_show.title} fetched.`);
		await save_transcript_to_db(active_show, transcript.result?.results.utterances || []);

		console.log(`Transcript for show #${active_show.number} - ${active_show.title} saved.`);
	} catch (e) {
		console.log(
			`Error fetching transcript for show #${active_show.number} - ${active_show.title}.`
		);
		console.log(e);
	}
}
