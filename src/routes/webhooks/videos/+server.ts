import { error, json } from '@sveltejs/kit';
import { YOUTUBE_API_KEY } from '$app/env/private';
import { import_next_video_captions } from '$server/video/video_captions';
import { sync_channel_videos } from '$server/video/video_sync';
import { get_youtube_connection } from '$server/video/youtube_owner';
import { has_auth } from '../transcripts/has_auth';

// workers/scheduled_jobs.ts runs this hourly. Each run:
// 1. reads the newest 50 uploads (2 quota units); the run in FULL_SYNC_HOUR_UTC, or ?full, reads
//    the whole channel (~60 units) and archives videos that are no longer public
// 2. on even UTC hours (or ?captions), saves one video's YouTube captions as its transcript
//    (250 units for historical archive; +400 when auto-cleaning & uploading recent <=30d uploads).
//    12 runs/day is ~3,000 of the 10,000 daily units, leaving ~6,800 units/day free for other
//    tools and priority caption cleanups without needing a Google quota extension. Captions wait
//    while YouTube isn't connected (Connect YouTube in admin).
const FULL_SYNC_HOUR_UTC = 9;
const CAPTION_HOUR_INTERVAL = 2;
const CAPTIONS_PER_RUN = 1;

async function import_captions(): Promise<string[]> {
	const connection = await get_youtube_connection();
	if (connection.status !== 'connected') {
		return [
			`Captions waiting: YouTube is ${connection.status === 'missing' ? 'not connected' : 'disconnected'}`
		];
	}
	const messages: string[] = [];
	for (let run = 0; run < CAPTIONS_PER_RUN; run++) {
		try {
			messages.push(await import_next_video_captions());
		} catch (caption_error) {
			// The sync above still counts; a failed caption is retried next hour
			console.error('Video captions: import failed', caption_error);
			messages.push(
				`Captions failed: ${caption_error instanceof Error ? caption_error.message : caption_error}`
			);
			break;
		}
	}
	return messages;
}

export const GET = async function video_sync_cron({ request, url }) {
	if (!has_auth(request)) error(401, 'Get outta here - Wrong Cron key or auth header');
	if (!YOUTUBE_API_KEY) error(503, 'Video sync is offline: YOUTUBE_API_KEY is not set');

	const utc_hour = new Date().getUTCHours();
	const every_page = url.searchParams.has('full') || utc_hour === FULL_SYNC_HOUR_UTC;
	const run_captions = url.searchParams.has('captions') || utc_hour % CAPTION_HOUR_INTERVAL === 0;
	const result = await sync_channel_videos(YOUTUBE_API_KEY, { every_page });
	const captions = run_captions ? await import_captions() : ['Captions skipped (odd UTC hour)'];
	const message = [
		`Video sync (${every_page ? 'whole channel' : 'newest 50'}): ${result.site_videos} videos, ${result.created} new, ${result.archived} archived`,
		...captions
	].join('. ');
	console.log(message);
	return json({ message, ...result });
};
