import { get, writable } from 'svelte/store';
import { get_local_storage } from '#utilities/storage.js';
import { get_youtube_id } from '#utilities/youtube.js';
import type { MediaKind } from './media_timeline';

const STORAGE_KEY = 'media_preference';

function read_preference(): MediaKind {
	return get_local_storage()?.getItem(STORAGE_KEY) === 'AUDIO' ? 'AUDIO' : 'VIDEO';
}

// Whether episodes with a YouTube video should play the video or the audio file. Defaults to video.
export const media_preference = writable<MediaKind>(read_preference());

media_preference.subscribe((value) => {
	get_local_storage()?.setItem(STORAGE_KEY, value);
});

// YouTube couldn't load at all this session (blocked network, ad blocker), so everything plays as audio
let is_youtube_unavailable = false;

export function mark_youtube_unavailable() {
	is_youtube_unavailable = true;
}

/**
 * Should this show play as a YouTube video?
 * Requires a video, a video preference, a network connection (offline always falls back to audio),
 * and YouTube not having failed to load.
 */
export function should_play_video(show: { youtube_url?: string | null } | null | undefined) {
	if (!show || !get_youtube_id(show.youtube_url)) return false;
	if (is_youtube_unavailable) return false;
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
	return get(media_preference) === 'VIDEO';
}
