import matter from 'gray-matter';
import { prisma_client as prisma } from '../../hooks.server';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import { get_md_from_folder } from '$utilities/file_utilities/get_md_from_folder';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { error } from '@sveltejs/kit';
import type { PrerecordedTranscriptionResponse, Utterance } from '@deepgram/sdk/dist/types';
import type { Show } from '@prisma/client';
import { detectSpeakerNames, getSlimUtterances } from './utils';

interface FrontMatterGuest {
	name: string;
	twitter: string;
	url: string;
	social: string[];
}

const transcripts_path = path.join(process.cwd(), 'src/assets/transcripts-flagged');

export async function save_transcript_to_db(show: Show, utterances: Utterance[]) {
	// Create Slim Utterances for Speaker Detection
	const slim_utterances = getSlimUtterances(utterances, show.number);
	// Detect Speakers
	const speakerMap = detectSpeakerNames(slim_utterances);
	const who = speakerMap.get(0);

	// Create Utterances
	const create_utterances = utterances.map((utterance) => {
		const words = utterance.words?.map((word) => {
			return {
				start: word.start,
				end: word.end,
				punctuated_word: word.punctuated_word || word.word,
				word: word.word,
				speaker_confidence: word.confidence,
				speaker: word.speaker || 99,
				confidence: word.confidence
			};
		});
		return {
			start: utterance.start,
			end: utterance.end,
			transcript_value: utterance.transcript,
			channel: utterance.channel,
			confidence: utterance.confidence,
			speaker: utterance.speaker || 99,
			speakerName: speakerMap.get(utterance.speaker || 99),
			words: {
				create: words
			}
		};
	});

	console.log(`About to Save to the DB`);
	console.log(create_utterances);

	return prisma.transcript.create({
		data: {
			show_number: show.number,
			utterances: {
				create: create_utterances
			}
		}
	});
}

// Import Transcripts from JSON file - used for the initial import
export async function import_transcripts() {
	try {
		const files = await fs.readdir(transcripts_path);
		// Filter only .md files
		const transcriptFiles = files.filter((file) => file.endsWith('.json'));
		// Loop over each one and import
		const transcript_promises = transcriptFiles.map(async (file) => {
			console.log(`Importing ${file}`);
			const transcript: PrerecordedTranscriptionResponse = JSON.parse(
				await readFile(path.join(transcripts_path, file), 'utf-8')
			);
			const show_number = parseInt(file.split(' - ')[0]);
			// Check if there is already a transcript for this show
			const existing_transcript = await prisma.transcript.findUnique({ where: { show_number } });
			if (existing_transcript) {
				// console.log('Transcript already exists, skipping');
				return;
			}
			// Find the show this transcript belongs to
			const show = await prisma.show.findUnique({ where: { number: show_number } });
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
		if (typeof err === 'string') throw error(500, err);
		if (err instanceof Error) {
			console.error('❌ Transcript Import Error:', err.message);
			throw error(500, `Error Importing Transcript: ${err.message}`);
		}
	}
}
