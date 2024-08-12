import { save_ai_notes_to_db } from '$server/ai/db';
import { generate_ai_notes } from '$server/ai/openai';
import { transcript_without_ai_notes_query } from '$server/ai/queries';
import { error, json } from '@sveltejs/kit';
import { has_auth } from '../transcripts/has_auth';
import type { RequestEvent } from './$types';
import { prisma_client } from '$/server/prisma-client';

export const config = {
	maxDuration: 300 // vercel timeout
};

export const GET = async function transcriptCronHandler({ request }: RequestEvent) {
	const start = Date.now();
	const allowed = has_auth(request);
	// 1. Make sure we have an API key
	if (!allowed) {
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	// 2. Get the latest show without a transcript
	const show = await prisma_client.show.findFirst(transcript_without_ai_notes_query);

	if (!show) {
		return json({ message: 'No shows without AI Show notes found.' });
	}

	console.log(`🤖 Found a show that needs AI show notes: show ${show.number} - ${show.title}`);

	const result = await generate_ai_notes(show);
	await save_ai_notes_to_db(result, show);
	// console.log(result);
	const duration = Date.now() - start;
	const minutes = Math.floor(duration / 60000);
	const seconds = (duration % 60000) / 1000;
	const message = `ai Cron Ran for Show #${show.number} ${show.title}. Took ${minutes}m ${seconds}s`;
	console.log(message);
	return json({
		message
	});
};
