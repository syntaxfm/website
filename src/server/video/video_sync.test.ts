import { describe, expect, it, vi } from 'vitest';

vi.mock('$server/db/client', () => ({ db: {} }));
vi.mock('$app/env/private', () => ({}));

import videos_fixture from './fixtures/videos_list.json';
import { read_channel_video } from './channel_videos';
import { is_site_video, pick_video_slug } from './video_sync';

function channel_video(index: number) {
	const video = read_channel_video(videos_fixture.items[index]);
	if (!video) throw new Error(`fixture item ${index} is not a public upload`);
	return video;
}

describe('is_site_video', () => {
	const episode_ids = new Set(['XPnpzSA8RlI']);

	it('keeps videos that are neither an episode nor a Short', () => {
		expect(is_site_video(channel_video(0), episode_ids)).toBe(true);
		expect(is_site_video(channel_video(1), episode_ids)).toBe(true);
	});

	it('leaves out podcast episodes and Shorts', () => {
		expect(is_site_video(channel_video(2), episode_ids)).toBe(false);
		expect(is_site_video(channel_video(3), episode_ids)).toBe(false);
	});
});

describe('pick_video_slug', () => {
	it('slugs the title', () => {
		expect(
			pick_video_slug('What the hell is going on with GitHub?', 'BvFD5dbnmik', new Set())
		).toBe('what-the-hell-is-going-on-with-github');
	});

	it('adds the video id when another content row has the slug', () => {
		const taken = new Set(['svelte-with-typescript-course-drop-party']);
		expect(pick_video_slug('Svelte with TypeScript Course Drop Party', 'AbC123xyz_-', taken)).toBe(
			'svelte-with-typescript-course-drop-party-abc123xyz_-'
		);
	});

	it('uses the video id when the title has nothing to slug', () => {
		expect(pick_video_slug('🔥🔥🔥', 'AbC123xyz_-', new Set())).toBe('abc123xyz_-');
	});
});
