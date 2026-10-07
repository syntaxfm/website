import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	get_saved_position,
	record_duration,
	reset_media_timeline,
	save_position,
	timelines_match,
	timelines_match_cached
} from './media_timeline';

function create_storage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => data.set(key, value),
		removeItem: (key: string) => data.delete(key),
		clear: () => data.clear()
	};
}

const youtube_url = 'https://www.youtube.com/watch?v=dj6tUUTDXAo';

describe('media_timeline', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', create_storage());
		reset_media_timeline();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('keeps audio and video positions separate', () => {
		save_position(1, 'AUDIO', 100, true);
		save_position(1, 'VIDEO', 250, true);
		expect(get_saved_position(1, 'AUDIO')).toBe(100);
		expect(get_saved_position(1, 'VIDEO')).toBe(250);
		// Audio keeps the original key
		expect(localStorage.getItem('last_played_position_1')).toBe('100');
	});

	it('throttles position writes unless forced', () => {
		save_position(1, 'VIDEO', 10);
		save_position(1, 'VIDEO', 12);
		expect(get_saved_position(1, 'VIDEO')).toBe(10);
		save_position(1, 'VIDEO', 16);
		expect(get_saved_position(1, 'VIDEO')).toBe(16);
		save_position(1, 'VIDEO', 17, true);
		expect(get_saved_position(1, 'VIDEO')).toBe(17);
	});

	it('only borrows the other position when the timelines match', () => {
		save_position(2, 'AUDIO', 300, true);
		expect(get_saved_position(2, 'VIDEO')).toBe(0);

		record_duration(2, 'AUDIO', 3600);
		record_duration(2, 'VIDEO', 3601.5);
		expect(timelines_match_cached(2)).toBe(true);
		expect(get_saved_position(2, 'VIDEO')).toBe(300);
	});

	it('detects mismatched timelines', async () => {
		record_duration(3, 'AUDIO', 3600);
		record_duration(3, 'VIDEO', 3450);
		expect(timelines_match_cached(3)).toBe(false);
		expect(await timelines_match({ number: 3, youtube_url })).toBe(false);
	});

	it('falls back to "no match" when durations are unknown', async () => {
		expect(timelines_match_cached(4)).toBeNull();
		expect(await timelines_match({ number: 4, youtube_url })).toBe(false);
	});

	it('waits for a mounted video to learn its duration', async () => {
		record_duration(5, 'AUDIO', 1800);
		const video_el = { duration: 1801, loadComplete: Promise.resolve() };
		expect(await timelines_match({ number: 5, youtube_url }, video_el)).toBe(true);
	});

	it('persists durations across sessions', () => {
		record_duration(6, 'AUDIO', 1200);
		record_duration(6, 'VIDEO', 1200);
		reset_media_timeline();
		expect(timelines_match_cached(6)).toBe(true);
	});
});
