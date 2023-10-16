import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { get_transcript } from '$server/transcripts/deepgram';

export const config = {
	maxDuration: 300 // vercel timeout
};

export const GET = async function transcriptCronHandler({ request, locals }: RequestEvent) {
	const start = Date.now();
	// await get_transcript(show_number);
	const url = new URL(request.url);
	const authHeader = request.headers.get('authorization');
	const cron_secret = url.searchParams.get('CRON_SECRET') === process.env.CRON_SECRET;
	const has_auth_header = authHeader === process.env.CRON_SECRET;
	const has_auth = cron_secret || has_auth_header;
	// 1. Make sure we have an API key
	if (!has_auth) {
		console.log('🤖 Unauthorized Transcript Cron Request', { cron_secret, has_auth_header });
		throw error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	// 2. Get the latest show without a transcript
	const show = await locals.prisma.show.findFirst({
		where: {
			transcript: null
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
