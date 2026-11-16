// Transcripts from xAI's Grok speech-to-text (https://docs.x.ai/developers/model-capabilities/audio/speech-to-text):
// it fetches the episode's mp3 itself, so the Worker never holds the audio. Deepgram made the
// transcripts up to #953.
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { XAI_API_KEY } from '$app/env/private';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { people_on_show } from '#lib/transcript/utils.ts';
import { keywords } from './fixes';
import { save_transcript_to_db } from './transcripts';
import type { TranscribedWord } from './types';
import { words_to_utterances } from './utterances';

const STT_URL = 'https://api.x.ai/v1/stt';
const STT_MODEL = 'grok-voice-transcribe-2.0';
// An hour-long episode took 31 s on 2026-11-16
const STT_TIMEOUT_MS = 10 * 60 * 1000;

function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function is_word(value: unknown): value is TranscribedWord {
	return (
		is_record(value) &&
		typeof value.text === 'string' &&
		typeof value.start === 'number' &&
		typeof value.end === 'number' &&
		typeof value.speaker === 'number'
	);
}

/** Every word of the audio at `audio_url`, with its time and voice. */
export async function transcribe_audio(
	audio_url: string,
	key_terms: readonly string[]
): Promise<TranscribedWord[]> {
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY is not set');

	const form = new FormData();
	form.append('model', STT_MODEL);
	form.append('language', 'en');
	form.append('diarize', 'true');
	// Spoken numbers as digits ("95%", "2024")
	form.append('format', 'true');
	for (const term of key_terms) form.append('keyterm', term);
	form.append('url', audio_url);

	const response = await fetch(STT_URL, {
		method: 'POST',
		headers: { authorization: `Bearer ${XAI_API_KEY}` },
		body: form,
		signal: AbortSignal.timeout(STT_TIMEOUT_MS)
	});
	if (!response.ok) {
		throw new Error(`Grok speech-to-text ${response.status}: ${await response.text()}`);
	}
	const body: unknown = await response.json();
	if (!is_record(body) || !Array.isArray(body.words) || !body.words.every(is_word)) {
		throw new Error('Grok speech-to-text returned words without text, times or speakers');
	}
	return body.words;
}

/** Transcribes a released episode and saves it. Fails if it already has a transcript. */
export async function get_transcript(show_number: number) {
	const active_show = await db.query.show.findFirst({
		where: eq(show.number, show_number),
		with: {
			transcript: { columns: { id: true } },
			hosts: { with: { profile: { columns: { name: true } } } },
			guests: { with: { guest: { columns: { name: true } } } }
		}
	});
	if (!active_show) error(404, `Show #${show_number} not found.`);
	if (active_show.transcript) {
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
	const saved = await save_transcript_to_db(active_show, words_to_utterances(words), people);
	console.log(`Transcript for show #${show_number} saved: ${words.length} words.`);
	return saved;
}
