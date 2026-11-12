import { YOUTUBE_API_KEY } from '$app/env/private';

// YouTube's API takes up to 50 ids per call
const MAX_IDS_PER_CALL = 50;

interface YouTubeStatisticsResponse {
	items?: Array<{
		id?: string;
		statistics?: { viewCount?: string };
	}>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Views per day since release. Counted from at least one day, so an episode out for an hour
 * isn't ranked on a handful of views multiplied up.
 */
export function get_views_per_day(views: number, released_at: string, now: number): number {
	const days = Math.max(1, (now - Date.parse(released_at)) / DAY_MS);
	return views / days;
}

/**
 * Each video's view count, by video id, in one YouTube API call. Videos YouTube doesn't return
 * (private, deleted) are left out. Throws when there's no API key or the call fails.
 */
export async function get_youtube_view_counts(
	video_ids: string[],
	fetcher: typeof globalThis.fetch = globalThis.fetch
): Promise<Map<string, number>> {
	if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY must be set to read view counts');
	if (video_ids.length > MAX_IDS_PER_CALL) {
		throw new TypeError(`YouTube reads at most ${MAX_IDS_PER_CALL} videos per call`);
	}
	if (video_ids.length === 0) return new Map();

	const url = new URL('https://www.googleapis.com/youtube/v3/videos');
	url.search = new URLSearchParams({
		part: 'statistics',
		id: video_ids.join(','),
		key: YOUTUBE_API_KEY
	}).toString();

	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(`YouTube view counts failed: ${response.status} ${response.statusText}`);
	}
	const data = (await response.json()) as YouTubeStatisticsResponse;

	const views = new Map<string, number>();
	for (const item of data.items ?? []) {
		const count = Number(item.statistics?.viewCount);
		if (item.id && Number.isFinite(count)) views.set(item.id, count);
	}
	return views;
}
