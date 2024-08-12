import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { get_transcript } from '$server/transcripts/deepgram';
import { has_auth } from './has_auth';
import { prisma_client } from '$/hooks.server';

export const config = {
	maxDuration: 300 // vercel timeout
};

export const GET = async function transcriptCronHandler({ request }: RequestEvent) {
	const start = Date.now();
	const allowed = has_auth(request);
	// 1. Make sure we have an API key
	if (!allowed) {
		console.log('🤖 Unauthorized Transcript Cron Request');
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	// 2. Get the latest show without a transcript
	const show = await prisma_client.show.findFirst({
		where: {
			AND: [{ transcript: null }, { number: { gt: 700 } }]
		},
		orderBy: {
			number: 'desc'
		}
	});

	if (!show) {
		return json({ message: 'No shows without transcripts found.' });
	}

	console.log(`🤖 Found a show that needs a transcript: show ${show.number} - ${show.title}`);
	const result = await get_transcript(show.number);
	console.log(result);
	const duration = Date.now() - start;
	const minutes = Math.floor(duration / 60000);
	const seconds = (duration % 60000) / 1000;
	const message = `Transcript Cron Ran for Show #${show.number} ${show.title}. Took ${minutes}m ${seconds}s`;
	console.log(message);
	return json({
		message
	});
};
