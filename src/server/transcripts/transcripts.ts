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
import { detectSpeakerNames, getSlimUtterances } from '#lib/transcript/utils.ts';
import { randomUUID } from 'crypto';
import type { NewUtterance } from './types';

const transcripts_path = path.join(process.cwd(), 'src/assets/transcripts-flagged');

type DeepgramUtterance = NonNullable<SyncPrerecordedResponse['results']['utterances']>[0];

// A whole transcript is one transaction, so a failure part way leaves no half-saved transcript for
// the cron to skip over. Rows go in batches well under Postgres's 65,535 parameters per query.
const ROWS_PER_INSERT = 2000;

function in_batches<T>(rows: readonly T[]): T[][] {
	const batches: T[][] = [];
	for (let index = 0; index < rows.length; index += ROWS_PER_INSERT) {
		batches.push(rows.slice(index, index + ROWS_PER_INSERT));
	}
	return batches;
}

/**
 * Saves a transcript's passages and words, each passage named by its voice.
 * @param people the episode's hosts and guests (people_on_show), so voices get the right names
 */
export async function save_transcript_to_db(
	show: Pick<Show, 'number'>,
	utterances: readonly NewUtterance[],
	people: string[] = []
) {
	const speaker_map = detectSpeakerNames(
		getSlimUtterances(
			utterances.map(({ speaker, start, end, transcript_value }) => ({
				speaker,
				start,
				end,
				transcript_value
			})),
			show.number
		),
		people
	);

	const transcript_id = randomUUID();
	const utterance_ids = utterances.map(() => randomUUID());
	const utterance_rows = utterances.map((utterance, index) => ({
		id: utterance_ids[index],
		transcript_id,
		start: utterance.start,
		end: utterance.end,
		transcript_value: utterance.transcript_value,
		speaker: utterance.speaker,
		speaker_name: speaker_map.get(utterance.speaker),
		channel: utterance.channel,
		confidence: utterance.confidence
	}));
	const word_rows = utterances.flatMap((utterance, index) =>
		utterance.words.map((word) => ({
			...word,
			id: randomUUID(),
			transcript_utterance_id: utterance_ids[index]
		}))
	);

	await db.transaction(async (tx) => {
		await tx.insert(transcripts).values({ id: transcript_id, show_number: show.number });
		for (const batch of in_batches(utterance_rows)) {
			await tx.insert(transcriptUtterances).values(batch);
		}
		for (const batch of in_batches(word_rows)) {
			await tx.insert(transcriptUtteranceWords).values(batch);
		}
	});
	console.log(
		`Saved transcript ${transcript_id} for show #${show.number}: ${utterance_rows.length} passages, ${word_rows.length} words`
	);

	return { id: transcript_id, show_number: show.number };
}

// Deepgram's utterances as passages to save, for the initial import of its JSON files
function from_deepgram(utterances: readonly DeepgramUtterance[]): NewUtterance[] {
	return utterances.map((utterance) => ({
		start: utterance.start,
		end: utterance.end,
		transcript_value: utterance.transcript,
		speaker: utterance.speaker ?? 99,
		channel: utterance.channel,
		confidence: utterance.confidence,
		words: (utterance.words ?? []).map((word) => ({
			word: word.word,
			punctuated_word: word.punctuated_word || word.word,
			start: word.start,
			end: word.end,
			speaker: word.speaker ?? 99,
			confidence: word.confidence,
			speaker_confidence: word.confidence
		}))
	}));
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
			await save_transcript_to_db(show, from_deepgram(transcript.results.utterances));
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
