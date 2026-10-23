// Audio and YouTube versions of an episode don't always share a timeline (different intros, cuts, etc).
// This module tracks each version's duration and saved position separately so we never apply
// an audio timestamp to a video (or vice versa) unless we know the two line up.
import { get_local_storage } from '#utilities/storage.js';
import { get_youtube_id } from '#utilities/youtube.js';

export type MediaKind = 'AUDIO' | 'VIDEO';

// How far apart (in seconds) audio and video durations can be and still be considered the same timeline
const TIMELINE_TOLERANCE = 3;
// Minimum seconds of playback between localStorage position writes
const SAVE_INTERVAL = 5;
const PROBE_TIMEOUT = 5000;

interface EpisodeDurations {
	audio?: number;
	video?: number;
}

const durations = new Map<number, EpisodeDurations>();
const last_saved = new Map<string, number>();

function position_key(show_number: number, kind: MediaKind) {
	// Audio keeps the original key so existing listening positions survive
	return kind === 'AUDIO'
		? `last_played_position_${show_number}`
		: `last_played_video_position_${show_number}`;
}

function durations_key(show_number: number) {
	return `episode_durations_${show_number}`;
}

function get_durations(show_number: number): EpisodeDurations {
	const cached = durations.get(show_number);
	if (cached) return cached;
	let stored: EpisodeDurations;
	try {
		stored = JSON.parse(get_local_storage()?.getItem(durations_key(show_number)) ?? '{}');
	} catch {
		stored = {};
	}
	durations.set(show_number, stored);
	return stored;
}

export function record_duration(show_number: number, kind: MediaKind, seconds: number) {
	if (!Number.isFinite(seconds) || seconds <= 0) return;
	const current = get_durations(show_number);
	const field = kind === 'AUDIO' ? 'audio' : 'video';
	if (current[field] === seconds) return;
	const next = { ...current, [field]: seconds };
	durations.set(show_number, next);
	get_local_storage()?.setItem(durations_key(show_number), JSON.stringify(next));
}

/**
 * Synchronous check using only durations we've already seen.
 * Returns null when we don't know yet.
 */
export function timelines_match_cached(show_number: number): boolean | null {
	const { audio, video } = get_durations(show_number);
	if (!audio || !video) return null;
	return Math.abs(audio - video) <= TIMELINE_TOLERANCE;
}

function probe_audio_duration(url: string): Promise<number | null> {
	if (typeof Audio === 'undefined') return Promise.resolve(null);
	return new Promise((resolve) => {
		const audio = new Audio();
		const finish = (value: number | null) => {
			clearTimeout(timeout);
			audio.removeAttribute('src');
			audio.load();
			resolve(value);
		};
		const timeout = setTimeout(() => finish(null), PROBE_TIMEOUT);
		audio.preload = 'metadata';
		audio.addEventListener('loadedmetadata', () => finish(audio.duration), { once: true });
		audio.addEventListener('error', () => finish(null), { once: true });
		audio.src = url;
	});
}

async function wait_for_video_duration(video_el: {
	duration: number;
	loadComplete?: Promise<void>;
}) {
	if (!video_el.loadComplete) return video_el.duration;
	const timeout = new Promise((resolve) => setTimeout(resolve, PROBE_TIMEOUT));
	await Promise.race([video_el.loadComplete, timeout]);
	return video_el.duration;
}

/**
 * Do the audio and video versions of this show line up?
 * Probes the audio file and waits on a mounted video element if durations aren't known yet.
 * When we can't tell, returns false so timestamps fall back to the (exact) audio timeline.
 */
export async function timelines_match(
	show: { number: number; url?: string; youtube_url?: string | null },
	video_el?: { duration: number; loadComplete?: Promise<void> } | null
): Promise<boolean> {
	if (!get_youtube_id(show.youtube_url)) return false;
	const cached = timelines_match_cached(show.number);
	if (cached !== null) return cached;

	const known = get_durations(show.number);
	const [audio_duration, video_duration] = await Promise.all([
		known.audio ?? (show.url ? probe_audio_duration(show.url) : null),
		known.video ?? (video_el ? wait_for_video_duration(video_el) : null)
	]);
	if (audio_duration) record_duration(show.number, 'AUDIO', audio_duration);
	if (video_duration) record_duration(show.number, 'VIDEO', video_duration);

	return timelines_match_cached(show.number) ?? false;
}

// This version's own saved position, without borrowing the other version's
function get_own_position(show_number: number, kind: MediaKind): number {
	const position = parseFloat(get_local_storage()?.getItem(position_key(show_number, kind)) ?? '');
	return Number.isFinite(position) && position > 0 ? position : 0;
}

export function get_saved_position(show_number: number, kind: MediaKind): number {
	const own = get_own_position(show_number, kind);
	if (own > 0) return own;
	// No position for this version yet, but if the timelines match we can borrow the other one's
	if (timelines_match_cached(show_number)) {
		return get_own_position(show_number, kind === 'AUDIO' ? 'VIDEO' : 'AUDIO');
	}
	return 0;
}

/**
 * Was this show last listened to as audio? True when there's an audio position and no video one,
 * e.g. listeners from before video playback existed.
 */
export function is_mid_audio(show_number: number): boolean {
	return get_own_position(show_number, 'AUDIO') > 0 && get_own_position(show_number, 'VIDEO') === 0;
}

/**
 * Saves the playback position. Throttled to once every SAVE_INTERVAL seconds of playback
 * unless `force` is set (pause, navigation, close, ended).
 */
export function save_position(
	show_number: number,
	kind: MediaKind,
	seconds: number,
	force = false
) {
	const storage = get_local_storage();
	if (!storage || !Number.isFinite(seconds) || seconds < 0) return;
	const key = position_key(show_number, kind);
	const previous = last_saved.get(key);
	if (!force && previous != null && Math.abs(seconds - previous) < SAVE_INTERVAL) return;
	last_saved.set(key, seconds);
	storage.setItem(key, seconds.toString());
}

// Test helper
export function reset_media_timeline() {
	durations.clear();
	last_saved.clear();
}
