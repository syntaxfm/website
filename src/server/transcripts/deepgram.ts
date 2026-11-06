import { createClient } from '@deepgram/sdk';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { keywords } from './fixes';
import { add_flagger_audio } from './flagger';
import { save_transcript_to_db } from './transcripts';
import { DEEPGRAM_SECRET } from '$app/env/private';

// Created on first use: the build loads this module without secrets (Cloudflare builds and
// deploys with none), and exiting the process there failed the build.
let deepgram_client: ReturnType<typeof createClient> | undefined;
function get_deepgram_client() {
	if (!DEEPGRAM_SECRET) throw new Error('DEEPGRAM_SECRET is not set');
	return (deepgram_client ??= createClient(DEEPGRAM_SECRET));
}

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
	const show_audio = await add_flagger_audio(active_show);
	console.log(`Fetching transcript for show #${active_show.number} - ${active_show.title}...`);

	try {
		const transcript = await get_deepgram_client().listen.prerecorded.transcribeFile(show_audio, {
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
