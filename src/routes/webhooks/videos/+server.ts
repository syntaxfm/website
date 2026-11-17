import { error, json } from '@sveltejs/kit';
import { YOUTUBE_API_KEY } from '$app/env/private';
import { sync_channel_videos } from '$server/video/video_sync';
import { has_auth } from '../transcripts/has_auth';

// workers/scheduled_jobs.ts runs this hourly. Each run reads the newest 50 uploads (2 quota
// units); the run in this UTC hour, or ?full, reads the whole channel (~60 units) and archives
// videos that are no longer public.
const FULL_SYNC_HOUR_UTC = 9;

export const GET = async function video_sync_cron({ request, url }) {
	if (!has_auth(request)) error(401, 'Get outta here - Wrong Cron key or auth header');
	if (!YOUTUBE_API_KEY) error(503, 'Video sync is offline: YOUTUBE_API_KEY is not set');

	const every_page =
		url.searchParams.has('full') || new Date().getUTCHours() === FULL_SYNC_HOUR_UTC;
	const result = await sync_channel_videos(YOUTUBE_API_KEY, { every_page });
	const message = `Video sync (${every_page ? 'whole channel' : 'newest 50'}): ${result.site_videos} videos, ${result.created} new, ${result.archived} archived`;
	console.log(message);
	return json({ message, ...result });
};
