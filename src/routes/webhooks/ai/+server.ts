import { save_ai_notes_to_db } from '#server/ai/db.js';
import { generate_ai_notes } from '#server/ai/notes.js';
import { transcript_without_ai_notes_query } from '#server/ai/queries.js';
import { redis } from '#hooks.server';
import { error } from '@sveltejs/kit';
import { has_auth } from '../transcripts/has_auth';
import type { RequestEvent } from './$types';
import { prisma_client } from '#server/prisma-client.js';

export const config = {
	maxDuration: 300 // vercel timeout
};

// A show that was tried waits this long before it's tried again, so a failing one doesn't block the shows behind it
const RETRY_COOLDOWN_S = 60 * 60 * 24;
// How many of the latest shows without notes to look through for one that wasn't tried recently
const CANDIDATES = 10;

const attempt_key = (show_number: number) => `ai-notes-tried:${show_number}`;

async function was_tried_recently(show_number: number) {
	if (!redis) return false;
	return Boolean(await redis.exists(attempt_key(show_number)).catch(() => 0));
}

// The latest show with a transcript and no AI notes, skipping ones tried recently
async function find_show_needing_notes() {
	const candidates = await prisma_client.show.findMany({
		where: transcript_without_ai_notes_query.where,
		orderBy: transcript_without_ai_notes_query.orderBy,
		select: { number: true },
		take: CANDIDATES
	});
	for (const { number } of candidates) {
		if (await was_tried_recently(number)) continue;
		return prisma_client.show.findFirst({
			...transcript_without_ai_notes_query,
			where: { ...transcript_without_ai_notes_query.where, number }
		});
	}
	return null;
}

export const GET = async function transcriptCronHandler({ request }: RequestEvent) {
	const start = Date.now();
	const allowed = has_auth(request);
	// 1. Make sure we have an API key
	if (!allowed) {
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	// 2. Get the latest show without AI notes
	const show = await find_show_needing_notes();

	if (!show) {
		return Response.json({ message: 'No shows without AI Show notes found.' });
	}

	console.log(`🤖 Found a show that needs AI show notes: show ${show.number} - ${show.title}`);

	// Marked before trying, so a run that times out counts as failed too. Once it has notes the query skips it anyway.
	await redis?.set(attempt_key(show.number), Date.now(), { ex: RETRY_COOLDOWN_S }).catch(() => {});
	const result = await generate_ai_notes(show);
	await save_ai_notes_to_db(result, show);
	// console.log(result);
	const duration = Date.now() - start;
	const minutes = Math.floor(duration / 60000);
	const seconds = (duration % 60000) / 1000;
	const message = `ai Cron Ran for Show #${show.number} ${show.title}. Took ${minutes}m ${seconds}s`;
	console.log(message);
	return Response.json({
		message
	});
};
