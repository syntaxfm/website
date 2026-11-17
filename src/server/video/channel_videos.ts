import { YOUTUBE_UPLOADS_PLAYLIST_ID } from '$const';
import { as_array, as_string, read_path } from '#lib/utils/narrow.ts';
import { get_seconds_from_iso_duration } from '#lib/videos/utils.ts';

// Reads the channel's public uploads from the YouTube Data API with the site's API key. The
// uploads list is newest first; each page of 50 costs 1 quota unit, and so does each videos call.

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const PAGE_SIZE = 50;
// Biggest to smallest: old uploads often have no maxres picture
const THUMBNAIL_SIZES = ['maxres', 'standard', 'high', 'medium', 'default'] as const;

export type ChannelVideo = {
	id: string;
	title: string;
	description: string;
	published_at: Date;
	thumbnail: string;
	duration_seconds: number;
	view_count: number | null;
};

async function fetch_youtube(path: string, params: Record<string, string>, api_key: string) {
	const url = new URL(`${API_BASE}/${path}`);
	url.search = new URLSearchParams({ ...params, key: api_key }).toString();
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`YouTube ${path} failed: ${response.status} ${await response.text()}`);
	}
	return (await response.json()) as unknown;
}

// A public, finished upload as the site stores it. Null for anything private, unlisted,
// scheduled or still live, so those never reach the database.
export function read_channel_video(item: unknown): ChannelVideo | null {
	const id = as_string(read_path(item, ['id']));
	const title = as_string(read_path(item, ['snippet', 'title']));
	const published = as_string(
		read_path(item, ['liveStreamingDetails', 'actualStartTime']) ??
			read_path(item, ['snippet', 'publishedAt'])
	);
	const thumbnail = THUMBNAIL_SIZES.map((size) =>
		as_string(read_path(item, ['snippet', 'thumbnails', size, 'url']))
	).find((url) => url !== null);
	if (
		!id ||
		!title ||
		!published ||
		!thumbnail ||
		read_path(item, ['status', 'privacyStatus']) !== 'public' ||
		read_path(item, ['snippet', 'liveBroadcastContent']) !== 'none'
	) {
		return null;
	}
	const views = Number(as_string(read_path(item, ['statistics', 'viewCount'])));
	return {
		id,
		title,
		description: as_string(read_path(item, ['snippet', 'description'])) ?? '',
		published_at: new Date(published),
		thumbnail,
		duration_seconds: get_seconds_from_iso_duration(
			as_string(read_path(item, ['contentDetails', 'duration']))
		),
		view_count: Number.isFinite(views) ? views : null
	};
}

// Upload ids, newest first: the newest page only, or every page
async function fetch_upload_ids(api_key: string, every_page: boolean): Promise<string[]> {
	const ids: string[] = [];
	let page_token: string | null = null;
	do {
		const page = await fetch_youtube(
			'playlistItems',
			{
				part: 'contentDetails',
				playlistId: YOUTUBE_UPLOADS_PLAYLIST_ID,
				maxResults: String(PAGE_SIZE),
				...(page_token ? { pageToken: page_token } : {})
			},
			api_key
		);
		for (const item of as_array(read_path(page, ['items']))) {
			const id = as_string(read_path(item, ['contentDetails', 'videoId']));
			if (id) ids.push(id);
		}
		page_token = every_page ? as_string(read_path(page, ['nextPageToken'])) : null;
	} while (page_token);
	return ids;
}

export async function fetch_channel_videos(
	api_key: string,
	{ every_page }: { every_page: boolean }
): Promise<ChannelVideo[]> {
	const ids = await fetch_upload_ids(api_key, every_page);
	const videos: ChannelVideo[] = [];
	for (let start = 0; start < ids.length; start += PAGE_SIZE) {
		const page = await fetch_youtube(
			'videos',
			{
				part: 'snippet,contentDetails,status,statistics,liveStreamingDetails',
				id: ids.slice(start, start + PAGE_SIZE).join(',')
			},
			api_key
		);
		for (const item of as_array(read_path(page, ['items']))) {
			const video = read_channel_video(item);
			if (video) videos.push(video);
		}
	}
	return videos;
}
