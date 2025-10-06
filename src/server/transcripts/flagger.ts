import { createWriteStream, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { FFmpeg } from '@ffmpeg.wasm/main';
import type { Show } from '@prisma/client';
import core from '@ffmpeg.wasm/core-mt';
import { env } from '$env/dynamic/private';
import { logProgress } from './logProgress';

const flag_paths = ['./audio/wes-flagger.mp3', './audio/scott-flagger.mp3'];

export type ProgressEvent = {
	duration?: number;
	ratio?: number;
	time: number;
	percentage: number;
};

async function downloadFile(url: string, path: string) {
	if (existsSync(path)) return;

	const stream = createWriteStream(path);
	const response = await fetch(url);
	if (response.body) {
		// @ts-expect-error body is readable
		await finished(Readable.fromWeb(response.body).pipe(stream));
	}
}

/**
 * Concatenates a show with flagger audio to help with diatirization
 * @returns {Promise<Buffer>} - The concatenated show
 * @param {string} mp3URL - The URL of the show to concat
 **/
export async function addFlaggerAudio(show: Show): Promise<Buffer> {
	console.log('ADDING FLAGGER AUDIO');
	const url = new URL(show.url);
	// Get the filename
	const file_name = `${show.number}.mp3`;
	//  Get the base name
	const [base_name, extension] = file_name.split('.');
	// create the output filename
	const output_filename = `${show.number}-flagged.${extension}`;
	console.log(`Downloading #${show.number} - ${show.title}`);
	console.log('Creating ffmpeg instance');
	await downloadFile(
		'https://cdn.jsdelivr.net/npm/@ffmpeg.wasm/core-mt@0.13.2/dist/core.wasm',
		'/tmp/core.wasm'
	);
	await downloadFile(
		'https://cdn.jsdelivr.net/npm/@ffmpeg.wasm/core-mt@0.13.2/dist/core.worker.js',
		'/tmp/core.worker.cjs'
	);
	const ffmpeg = await FFmpeg.create({
		log: true,
		core: core,
		coreOptions: {
			wasmPath: '/tmp/core.wasm',
			workerPath: '/tmp/core.worker.cjs'
		},
		logger: (type, ...message) => {
			logProgress(message.join(' '));
		}
	});
	console.log('Loading ffmpeg');

	// 1. download the show
	// 1.1 See if the file exists first
	await fetch(url, { method: 'HEAD' });
	console.log(`Fetching ${url}`);
	const fetch_buffer = await fetch(url)
		.then((res) => res.arrayBuffer())
		.then((buf) => Buffer.from(new Uint8Array(buf)));

	// Load it into ffmpeg memory
	ffmpeg.fs.writeFile(file_name, fetch_buffer);

	console.log(`wrote ${file_name} to ffmpeg memory`);
	// Write Flaggers to ffmpeg memory
	for (const [i, flag_path] of flag_paths.entries()) {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const __dirname = new URL('.', import.meta.url).pathname;
		const flag_buffer = await readFile(env.VERCEL ? flag_path : `${__dirname}/${flag_path}`);
		ffmpeg.fs.writeFile(`flagger-${base_name}-${i}.mp3`, flag_buffer);
		console.log(`wrote flagger-${base_name}-${i}.mp3 to ffmpeg memory`);
	}

	// Create the Command
	const command = [
		'-i',
		file_name,
		...flag_paths.map((flagPath, i) => ['-i', `flagger-${base_name}-${i}.mp3`]).flat(),
		'-filter_complex',
		'[0:a:0][1:a:0][2:a:0]concat=n=3:v=0:a=1[outa]',
		'-map',
		'[outa]',
		output_filename
	];

	console.log(`Running ffmpeg with command: ${command.join(' ')}`);
	// Run ffmpeg
	await ffmpeg.run(...command);
	// Get the Uint8Array
	const data = ffmpeg.fs.readFile(output_filename);
	// Convert to buffer
	const buffer = Buffer.from(data.buffer);
	return buffer;
}
