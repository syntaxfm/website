import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { get_transcript } from '$server/transcripts/deepgram';

export const config = {
	maxDuration: 300 // vercel timeout
};

function has_auth(request: RequestEvent) {
	const url = new URL(request.url);
	const auth_header = request.headers.get('authorization');
	const cron_secret = url.searchParams.get('CRON_SECRET') === process.env.CRON_SECRET;
	const has_auth_header = auth_header === `Bearer ${process.env.CRON_SECRET}`;
	const has_auth = cron_secret || has_auth_header;
	console.log({
		auth_header,
		cron_secret,
		has_auth_header,
		has_auth
	});
	return has_auth;
}

export const GET = async function transcriptCronHandler({ request, locals }: RequestEvent) {
	const start = Date.now();
	const allowed = has_auth(request);
	// 1. Make sure we have an API key
	if (!has_auth) {
		console.log('🤖 Unauthorized Transcript Cron Request');
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
