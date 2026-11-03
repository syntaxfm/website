import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import { read } from '$app/server';

import wes_flagger from './audio/wes-flagger.mp3';
import scott_flagger from './audio/scott-flagger.mp3';
import type { Show } from '$server/db/types';

const flag_paths = [wes_flagger, scott_flagger];

/**
 * Appends flagger audio to a show to help with diarization, streaming the show instead of loading it into memory.
 * The flaggers are encoded to match the show's MP3 format (44.1kHz stereo 320k, no tags), so their frames can be appended as is.
 **/
export async function add_flagger_audio(show: Show): Promise<Readable> {
	const flaggers = await Promise.all(
		flag_paths.map(async (flag_path) => new Uint8Array(await read(flag_path).arrayBuffer()))
	);

	const response = await fetch(show.url);
	if (!response.ok || !response.body) {
		throw new Error(`Failed to fetch ${show.url}: ${response.status}`);
	}
	const show_body = response.body as ReadableStream<Uint8Array>;

	async function* show_with_flaggers() {
		yield* show_body;
		yield* flaggers;
	}

	return Readable.from(show_with_flaggers());
}
