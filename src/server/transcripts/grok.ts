// Transcripts from xAI's Grok speech-to-text (https://docs.x.ai/developers/model-capabilities/audio/speech-to-text).
// Deepgram made the transcripts up to #953.
import { in_order_added } from '#lib/utils/in_order_added.ts';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { XAI_API_KEY } from '$app/env/private';
import { read } from '$app/server';
import { db } from '$server/db/client';
import { show, transcript } from '$server/db/schema';
import { people_on_show } from '#lib/transcript/utils.ts';
import { keywords } from './fixes';
import { save_transcript_to_db } from './transcripts';
import type { TranscribedWord } from './types';
import { words_to_utterances } from './utterances';
import wes_clip from './audio/wes-flagger.mp3';
import scott_clip from './audio/scott-flagger.mp3';

const STT_URL = 'https://api.x.ai/v1/stt';
const STT_MODEL = 'grok-voice-transcribe-2.0';
// An hour-long episode took 31 s on 2026-11-16
const STT_TIMEOUT_MS = 10 * 60 * 1000;
// Saving waits 15 s, then 30 s, before trying again
const SAVE_ATTEMPTS = 3;
const SAVE_RETRY_WAIT_MS = 15 * 1000;

// Wes and Scott each saying a set line ("my dog eats food on the moon", "purple cheese before
// meeting my brother"), played after the episode so Grok puts each line in that host's voice and
// detectSpeakerNames can name it. Encoded like the episodes (MP3 320k, 44.1 kHz stereo, no tags),
// so their frames append as is. Readers never see these lines (remove_flagging_utterances).
const VOICE_CLIPS = [wes_clip, scott_clip];

function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

// Grok has already charged for the audio by the time its words arrive, so an odd word mustn't
// fail the run (the cron would pay again next time): one without text or times is dropped, one
// without a voice keeps the voice before it.
function words_from(body: unknown): TranscribedWord[] {
	if (!is_record(body) || !Array.isArray(body.words)) {
		throw new Error('Grok speech-to-text returned no words');
	}
	const words: TranscribedWord[] = [];
	for (const word of body.words) {
		if (!is_record(word) || typeof word.text !== 'string') continue;
		if (typeof word.start !== 'number' || typeof word.end !== 'number') continue;
		const speaker = typeof word.speaker === 'number' ? word.speaker : (words.at(-1)?.speaker ?? 0);
		words.push({ text: word.text, start: word.start, end: word.end, speaker });
	}
	return words;
}

// A multipart/form-data body that streams `file_chunks` as its last part (Grok wants the file
// last), so an episode passes through without being held in memory. Sent chunked; Grok accepts that.
function multipart_body(
	boundary: string,
	fields: readonly [string, string][],
	file_chunks: AsyncIterable<Uint8Array>
): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	const head =
		fields
			.map(
				([name, value]) =>
					`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
			)
			.join('') +
		`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="episode.mp3"\r\n` +
		'Content-Type: audio/mpeg\r\n\r\n';

	async function* parts() {
		yield encoder.encode(head);
		yield* file_chunks;
		yield encoder.encode(`\r\n--${boundary}--\r\n`);
	}
	const iterator = parts();
	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await iterator.next();
			if (done) controller.close();
			else controller.enqueue(value);
		},
		async cancel(reason) {
			await iterator.return(reason);
		}
	});
}

async function* chunks_of(stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
	const reader = stream.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

/** Every word of the episode at `audio_url`, then of the voice clips, with its time and voice. */
export async function transcribe_audio(
	audio_url: string,
	key_terms: readonly string[]
): Promise<TranscribedWord[]> {
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY is not set');

	const clips = await Promise.all(
		VOICE_CLIPS.map(async (clip) => new Uint8Array(await read(clip).arrayBuffer()))
	);
	const episode = await fetch(audio_url);
	if (!episode.ok || !episode.body) {
		throw new Error(`Couldn't fetch the episode audio ${audio_url}: ${episode.status}`);
	}
	const episode_body = episode.body;
	async function* audio() {
		yield* chunks_of(episode_body);
		yield* clips;
	}

	const boundary = `syntax-${crypto.randomUUID()}`;
	const fields: [string, string][] = [
		['model', STT_MODEL],
		['language', 'en'],
		['diarize', 'true'],
		// Spoken numbers as digits ("95%", "2024")
		['format', 'true'],
		...key_terms.map((term): [string, string] => ['keyterm', term])
	];
	// `duplex` is how Node's fetch takes a streamed body; Workers stream it either way
	const init: RequestInit & { duplex: 'half' } = {
		method: 'POST',
		headers: {
			authorization: `Bearer ${XAI_API_KEY}`,
			'content-type': `multipart/form-data; boundary=${boundary}`
		},
		body: multipart_body(boundary, fields, audio()),
		duplex: 'half',
		signal: AbortSignal.timeout(STT_TIMEOUT_MS)
	};
	const response = await fetch(STT_URL, init);
	if (!response.ok) {
		throw new Error(`Grok speech-to-text ${response.status}: ${await response.text()}`);
	}
	const body: unknown = await response.json();
	return words_from(body);
}

/**
 * Transcribes a released episode with Grok and saves it. Fails if it already has a transcript,
 * unless replacing it.
 * @param replace swap out the episode's transcript; the old one is only dropped once Grok has
 *   returned the new words, so a failed run leaves it in place
 */
export async function get_transcript(show_number: number, { replace = false } = {}) {
	const active_show = await db.query.show.findFirst({
		where: eq(show.number, show_number),
		with: {
			transcript: { columns: { id: true } },
			hosts: {
				orderBy: in_order_added,
				with: { profile: { columns: { name: true } } }
			},
			guests: {
				orderBy: in_order_added,
				with: { guest: { columns: { name: true } } }
			}
		}
	});
	if (!active_show) error(404, `Show #${show_number} not found.`);
	const content_id = active_show.content_id;
	if (!content_id)
		error(409, `Show #${show_number} has no content item to attach a transcript to.`);
	if (active_show.transcript && !replace) {
		error(
			409,
			`Transcript for show #${show_number} already exists. Delete it if you want to re-fetch it.`
		);
	}

	const people = people_on_show(
		active_show.hosts.flatMap(({ profile }) => profile.name ?? []),
		active_show.guests.map(({ guest }) => guest.name)
	);
	console.log(`Transcribing show #${show_number} - ${active_show.title}...`);
	const words = await transcribe_audio(active_show.url, [...keywords, ...people]);
	const utterances = words_to_utterances(words);
	if (active_show.transcript) {
		await db.delete(transcript).where(eq(transcript.id, active_show.transcript.id));
	}

	// Grok has charged by now, so a database blip mustn't lose the words (the cron would pay again)
	for (let attempt = 1; ; attempt++) {
		try {
			const saved = await save_transcript_to_db(
				{ number: active_show.number, content_id },
				utterances,
				people
			);
			console.log(`Transcript for show #${show_number} saved: ${words.length} words.`);
			return saved;
		} catch (save_error) {
			if (attempt === SAVE_ATTEMPTS) throw save_error;
			console.error(
				`Saving show #${show_number}'s transcript failed (try ${attempt} of ${SAVE_ATTEMPTS})`,
				save_error
			);
			await new Promise((resolve) => setTimeout(resolve, attempt * SAVE_RETRY_WAIT_MS));
		}
	}
}
