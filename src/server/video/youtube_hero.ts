import { YOUTUBE_API_KEY } from '$app/env/private';
import { YOUTUBE_CHANNEL_ID } from '$const';
import { edge_cached } from '$server/edge_cache';
import { get_seconds_from_iso_duration } from '#lib/videos/utils.ts';

// The video in Home's hero: the live stream while Syntax is live, otherwise the newest thing the
// channel put out that isn't a Short. Read straight from YouTube, so it covers episodes, live
// stream replays and the videos that never become an episode.

const CACHE_TTL_MS = 60 * 1000;
const UPLOADS_PLAYLIST_ID = YOUTUBE_CHANNEL_ID.replace(/^UC/, 'UU');
// YouTube's API doesn't say what is a Short. They can run up to 3 minutes.
const SHORT_MAX_SECONDS = 3 * 60;

type Fetcher = typeof globalThis.fetch;

interface YouTubePlaylistItemResponse {
	items?: Array<{
		contentDetails?: {
			videoId?: string;
		};
	}>;
}

export interface YouTubeVideoItem {
	id?: string;
	snippet?: {
		channelId?: string;
		title?: string;
		publishedAt?: string;
		liveBroadcastContent?: 'live' | 'none' | 'upcoming';
	};
	contentDetails?: {
		duration?: string;
	};
	status?: {
		embeddable?: boolean;
		privacyStatus?: string;
	};
	liveStreamingDetails?: {
		actualStartTime?: string;
		actualEndTime?: string;
	};
}

interface YouTubeVideoResponse {
	items?: YouTubeVideoItem[];
}

export interface YouTubeHeroVideo {
	id: string;
	title: string;
	is_live: boolean;
}

interface HeroVideoCache {
	expires_at: number;
	video: YouTubeHeroVideo | null;
}

let hero_video_cache: HeroVideoCache | null = null;
let pending_request: Promise<YouTubeHeroVideo | null> | null = null;

async function fetch_json<T>(fetcher: Fetcher, url: URL): Promise<T> {
	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
}

function is_showable(item: YouTubeVideoItem) {
	return (
		item.snippet?.channelId === YOUTUBE_CHANNEL_ID &&
		item.status?.privacyStatus === 'public' &&
		item.status.embeddable === true
	);
}

function is_live(item: YouTubeVideoItem) {
	return item.snippet?.liveBroadcastContent === 'live' && !item.liveStreamingDetails?.actualEndTime;
}

// A finished video or stream replay, long enough not to be a Short. Scheduled streams wait their turn.
function is_released_long_video(item: YouTubeVideoItem) {
	return (
		item.snippet?.liveBroadcastContent === 'none' &&
		get_seconds_from_iso_duration(item.contentDetails?.duration) > SHORT_MAX_SECONDS
	);
}

// A stream is "published" when it's scheduled, which can be days before it airs
function get_released_at(item: YouTubeVideoItem) {
	return item.liveStreamingDetails?.actualStartTime ?? item.snippet?.publishedAt ?? null;
}

function by_newest(a: YouTubeVideoItem, b: YouTubeVideoItem) {
	return Date.parse(get_released_at(b) ?? '') - Date.parse(get_released_at(a) ?? '');
}

/**
 * Picks the hero's video from the channel's recent uploads: the live stream if there is one,
 * otherwise the newest released video that isn't a Short. Null when nothing qualifies.
 */
export function pick_hero_video(items: YouTubeVideoItem[]): YouTubeHeroVideo | null {
	const showable = items.filter(
		(item) =>
			is_showable(item) && get_released_at(item) && (is_live(item) || is_released_long_video(item))
	);
	const video = showable.find(is_live) ?? showable.sort(by_newest)[0];

	if (!video?.id || !video.snippet?.title) {
		return null;
	}

	return {
		id: video.id,
		title: video.snippet.title,
		is_live: is_live(video)
	};
}

async function fetch_youtube_hero_video(fetcher: Fetcher): Promise<YouTubeHeroVideo | null> {
	if (!YOUTUBE_API_KEY) {
		return null;
	}

	const playlist_url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
	playlist_url.search = new URLSearchParams({
		part: 'contentDetails',
		playlistId: UPLOADS_PLAYLIST_ID,
		maxResults: '50',
		key: YOUTUBE_API_KEY
	}).toString();

	const playlist_data = await fetch_json<YouTubePlaylistItemResponse>(fetcher, playlist_url);
	const video_ids =
		playlist_data.items?.flatMap((item) =>
			item.contentDetails?.videoId ? [item.contentDetails.videoId] : []
		) ?? [];

	if (video_ids.length === 0) {
		return null;
	}

	const videos_url = new URL('https://www.googleapis.com/youtube/v3/videos');
	videos_url.search = new URLSearchParams({
		part: 'snippet,contentDetails,status,liveStreamingDetails',
		id: video_ids.join(','),
		key: YOUTUBE_API_KEY
	}).toString();

	const videos_data = await fetch_json<YouTubeVideoResponse>(fetcher, videos_url);
	return pick_hero_video(videos_data.items ?? []);
}

export async function get_youtube_hero_video(
	fetcher: Fetcher = globalThis.fetch
): Promise<YouTubeHeroVideo | null> {
	if (hero_video_cache && hero_video_cache.expires_at > Date.now()) {
		return hero_video_cache.video;
	}

	if (pending_request) {
		return pending_request;
	}

	// The in-memory cache lives in one Worker isolate, so most requests missed it and waited on two
	// sequential YouTube API calls (up to ~600 ms). The edge cache is shared by every isolate in a
	// Cloudflare location and refreshes in the background.
	pending_request = edge_cached(
		'youtube-hero-video',
		{ fresh_seconds: CACHE_TTL_MS / 1000, stale_seconds: 60 * 10 },
		() => fetch_youtube_hero_video(fetcher)
	);

	try {
		const video = await pending_request;
		hero_video_cache = {
			expires_at: Date.now() + CACHE_TTL_MS,
			video
		};
		return video;
	} finally {
		pending_request = null;
	}
}
