import { error, json } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/deepgram';
import { has_auth } from './has_auth';
import { db } from '$server/db/client';
import { shows } from '$server/db/schema';
import { gt, desc } from 'drizzle-orm';

export const config = {
	maxDuration: 300 // vercel timeout
};

export const GET = async function transcriptCronHandler({ request }) {
	const start = Date.now();
	const allowed = has_auth(request);
	// 1. Make sure we have an API key
	if (!allowed) {
		console.log('🤖 Unauthorized Transcript Cron Request');
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	// 2. Get the latest show without a transcript
	const allShows = await db.query.shows.findMany({
		with: {
			transcript: {}
		},
		where: gt(shows.number, 700),
		orderBy: [desc(shows.number)]
	});

	const show = allShows.find((s) => !s.transcript);

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
