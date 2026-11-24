import type { Show } from '$server/db/types';
import { db } from '$server/db/client';
import {
	transcript as transcripts,
	transcriptUtterance as transcriptUtterances,
	transcriptUtteranceWord as transcriptUtteranceWords
} from '$server/db/schema';
import { detectSpeakerNames, getSlimUtterances } from '#lib/transcript/utils.ts';
import { randomUUID } from 'crypto';
import type { NewUtterance } from './types';

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
	// The episode's number names its voices; its content id is what the transcript belongs to
	show: Pick<Show, 'number'> & { content_id: string },
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
		await tx.insert(transcripts).values({ id: transcript_id, content_id: show.content_id });
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

	return { id: transcript_id, content_id: show.content_id };
}
