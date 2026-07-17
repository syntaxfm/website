import { env } from '$env/dynamic/private';
import { YOUTUBE_CHANNEL_ID } from '$const';

const CACHE_TTL_MS = 60 * 1000;
const UPLOADS_PLAYLIST_ID = YOUTUBE_CHANNEL_ID.replace(/^UC/, 'UU');

type Fetcher = typeof globalThis.fetch;

interface YouTubePlaylistItemResponse {
	items?: Array<{
		contentDetails?: {
			videoId?: string;
		};
	}>;
}

interface YouTubeVideoResponse {
	items?: Array<{
		id?: string;
		snippet?: {
			channelId?: string;
			title?: string;
			liveBroadcastContent?: 'live' | 'none' | 'upcoming';
			tags?: string[];
		};
		status?: {
			embeddable?: boolean;
			privacyStatus?: string;
		};
		liveStreamingDetails?: {
			actualStartTime?: string;
			actualEndTime?: string;
		};
	}>;
}

export interface YouTubeLiveStream {
	id: string;
	title: string;
	url: string;
	embed_url: string;
	started_at: string | null;
	labels: string[];
}

interface LiveStreamCache {
	expires_at: number;
	stream: YouTubeLiveStream | null;
}

let live_stream_cache: LiveStreamCache | null = null;
let pending_request: Promise<YouTubeLiveStream | null> | null = null;

async function fetch_json<T>(fetcher: Fetcher, url: URL): Promise<T> {
	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
}

async function fetch_youtube_live_stream(fetcher: Fetcher): Promise<YouTubeLiveStream | null> {
	if (!env.YOUTUBE_API_KEY) {
		return null;
	}

	const playlist_url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
	playlist_url.search = new URLSearchParams({
		part: 'contentDetails',
		playlistId: UPLOADS_PLAYLIST_ID,
		maxResults: '50',
		key: env.YOUTUBE_API_KEY
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
		part: 'snippet,status,liveStreamingDetails',
		id: video_ids.join(','),
		key: env.YOUTUBE_API_KEY
	}).toString();

	const videos_data = await fetch_json<YouTubeVideoResponse>(fetcher, videos_url);
	const live_video = videos_data.items?.find(
		(item) =>
			item.snippet?.channelId === YOUTUBE_CHANNEL_ID &&
			item.snippet.liveBroadcastContent === 'live' &&
			item.status?.privacyStatus === 'public' &&
			item.status.embeddable === true &&
			!item.liveStreamingDetails?.actualEndTime
	);

	if (!live_video?.id || !live_video.snippet?.title) {
		return null;
	}

	return {
		id: live_video.id,
		title: live_video.snippet.title,
		url: `https://www.youtube.com/watch?v=${live_video.id}`,
		embed_url: `https://www.youtube-nocookie.com/embed/${live_video.id}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1`,
		started_at: live_video.liveStreamingDetails?.actualStartTime ?? null,
		labels: live_video.snippet.tags?.slice(0, 3) ?? []
	};
}

export async function get_youtube_live_stream(
	fetcher: Fetcher = globalThis.fetch
): Promise<YouTubeLiveStream | null> {
	if (live_stream_cache && live_stream_cache.expires_at > Date.now()) {
		return live_stream_cache.stream;
	}

	if (pending_request) {
		return pending_request;
	}

	pending_request = fetch_youtube_live_stream(fetcher);

	try {
		const stream = await pending_request;
		live_stream_cache = {
			expires_at: Date.now() + CACHE_TTL_MS,
			stream
		};
		return stream;
	} finally {
		pending_request = null;
	}
}
