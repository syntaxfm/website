import type { SyncPrerecordedResponse } from '@deepgram/sdk';
import type { Show } from '$server/db/types';
import { error } from '@sveltejs/kit';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import { db } from '$server/db/client';
import {
	show as shows,
	transcript as transcripts,
	transcriptUtterance as transcriptUtterances,
	transcriptUtteranceWord as transcriptUtteranceWords
} from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { detectSpeakerNames, getSlimUtterances } from './utils';
import pMap from 'p-map';
import { randomUUID } from 'crypto';

const transcripts_path = path.join(process.cwd(), 'src/assets/transcripts-flagged');

type Utterance = NonNullable<SyncPrerecordedResponse['results']['utterances']>[0];

export async function save_transcript_to_db(show: Show, utterances: Utterance[]) {
	// Create Slim Utterances for Speaker Detection
	const slim_utterances = getSlimUtterances(utterances, show.number);
	// Detect Speakers
	const speaker_map = detectSpeakerNames(slim_utterances);

	// Create Utterances
	const create_utterances = utterances.map((utterance) => {
		const words = utterance.words?.map((word) => {
			return {
				start: word.start,
				end: word.end,
				punctuated_word: word.punctuated_word || word.word,
				word: word.word,
				speaker_confidence: word.confidence,
				speaker: word.speaker ?? 99,
				confidence: word.confidence
			};
		});
		return {
			start: utterance.start,
			end: utterance.end,
			transcript_value: utterance.transcript,
			channel: utterance.channel,
			confidence: utterance.confidence,
			speaker: utterance.speaker ?? 99,
			speakerName: speaker_map.get(utterance.speaker ?? 99),
			words: {
				create: words
			}
		};
	});

	// const start = Date.now();
	console.log(`About to Save to the DB`);

	// 1. Create the Transcript Record
	const transcript_id = randomUUID();
	await db.insert(transcripts).values({
		id: transcript_id,
		show_number: show.number
	});
	console.log(`Created Transcript Record: ${transcript_id}`);
	console.log(`About to create ${create_utterances.length} utterances`);

	// 2. Create the Utterances
	async function saveUtterance({ words, ...utterance }: (typeof create_utterances)[0]) {
		console.log(`Creating Utterance: ${utterance.start}`);
		const utterance_id = randomUUID();

		await db.insert(transcriptUtterances).values({
			id: utterance_id,
			...utterance,
			transcript_id: transcript_id
		});

		console.log(`Creating Words for Utterance: ${utterance.start} (${words.create.length})`);
		await db.insert(transcriptUtteranceWords).values(
			words.create.map((word) => ({
				id: randomUUID(),
				...word,
				transcript_utterance_id: utterance_id
			}))
		);
	}

	// Only save 100 at a time so we don't hit DB limits
	await pMap(create_utterances, saveUtterance, { concurrency: 100 });

	return { id: transcript_id, show_number: show.number };
}

// Import Transcripts from JSON file - used for the initial import
export async function import_transcripts() {
	try {
		const files = await fs.readdir(transcripts_path);
		// Filter only .md files
		const transcript_files = files.filter((file) => file.endsWith('.json'));
		// Loop over each one and import
		const transcript_promises = transcript_files.map(async (file) => {
			console.log(`Importing ${file}`);
			const transcript: SyncPrerecordedResponse = JSON.parse(
				await readFile(path.join(transcripts_path, file), 'utf-8')
			);
			const show_number = parseInt(file.split(' - ')[0]);
			// Check if there is already a transcript for this show
			const existing_transcript = await db.query.transcript.findFirst({
				where: eq(transcripts.show_number, show_number)
			});
			if (existing_transcript) {
				// console.log('Transcript already exists, skipping');
				return;
			}
			// Find the show this transcript belongs to
			const show = await db.query.show.findFirst({
				where: eq(shows.number, show_number)
			});
			if (!show) {
				console.log('No associated show found');
				return;
			}
			if (!transcript.results?.utterances) {
				console.log('No utterances found');
				return;
			}
			// Save to utterances to DB
			console.log(
				`Saving ${transcript.results?.utterances.length} utterances to DB for show ${show.number}`
			);
			await save_transcript_to_db(show, transcript.results?.utterances);
		});
		const results = await Promise.allSettled(transcript_promises);
		const success = results.filter((promise) => promise.status === 'fulfilled');

		return {
			message: `Transcripts Import finished: ${success.length} out of ${transcript_promises.length} successfull`
		};
	} catch (err) {
		if (typeof err === 'string') error(500, err);
		if (err instanceof Error) {
			console.error('❌ Transcript Import Error:', err.message);
			error(500, `Error Importing Transcript: ${err.message}`);
		}
	}
}
