import { error, json } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/grok';
import { has_auth } from './has_auth';
import { db } from '$server/db/client';
import { show as shows } from '$server/db/schema';
import { and, desc, gt } from 'drizzle-orm';
import { has_show_number, released_show_clause } from '$server/content/released';

// Transcribes the newest released episode that has no transcript yet, one per call
export const GET = async function transcriptCronHandler({ request }) {
	const start = Date.now();
	if (!has_auth(request)) {
		console.log('🤖 Unauthorized Transcript Cron Request');
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}

	const released_shows = await db.query.show.findMany({
		columns: { number: true, title: true },
		with: { transcript: { columns: { id: true } } },
		where: and(gt(shows.number, 700), released_show_clause()),
		orderBy: [desc(shows.number)]
	});
	const show = released_shows.filter(has_show_number).find((s) => !s.transcript);
	if (!show) {
		return json({ message: 'No shows without transcripts found.' });
	}

	console.log(`🤖 Found a show that needs a transcript: show ${show.number} - ${show.title}`);
	await get_transcript(show.number);
	const seconds = Math.round((Date.now() - start) / 1000);
	const message = `Transcribed show #${show.number} ${show.title} in ${seconds}s`;
	console.log(message);
	return json({ message });
};
