import { get, writable } from 'svelte/store';
import { get_youtube_id } from '$utilities/youtube';
import type { MediaKind } from './media_timeline';

const STORAGE_KEY = 'media_preference';

function read_preference(): MediaKind {
	if (typeof localStorage === 'undefined') return 'VIDEO';
	return localStorage.getItem(STORAGE_KEY) === 'AUDIO' ? 'AUDIO' : 'VIDEO';
}

// Whether episodes with a YouTube video should play the video or the audio file. Defaults to video.
export const media_preference = writable<MediaKind>(read_preference());

media_preference.subscribe((value) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, value);
	}
});

/**
 * Should this show play as a YouTube video?
 * Requires a video, a video preference, and a network connection (offline always falls back to audio).
 */
export function should_play_video(show: { youtube_url?: string | null } | null | undefined) {
	if (!show || !get_youtube_id(show.youtube_url)) return false;
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
	return get(media_preference) === 'VIDEO';
}
