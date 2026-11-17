import { describe, expect, it } from 'vitest';
import videos_fixture from './fixtures/videos_list.json';
import { read_channel_video } from './channel_videos';

const [level_up, github, episode, short] = videos_fixture.items;

describe('read_channel_video', () => {
	it('reads a public upload into what the site stores', () => {
		expect(read_channel_video(level_up)).toEqual({
			id: 'p7AnLyQFw9Y',
			title: 'WordPress Basics #12 - Adding A Theme',
			description: level_up.snippet.description,
			published_at: new Date(level_up.snippet.publishedAt),
			thumbnail: level_up.snippet.thumbnails.maxres.url,
			duration_seconds: 4 * 60 + 36,
			view_count: Number(level_up.statistics.viewCount)
		});
		expect(read_channel_video(github)?.duration_seconds).toBe(31 * 60 + 23);
		expect(read_channel_video(episode)?.id).toBe('XPnpzSA8RlI');
		expect(read_channel_video(short)?.duration_seconds).toBe(22);
	});

	it('skips private, unlisted, scheduled and live uploads', () => {
		for (const privacyStatus of ['private', 'unlisted']) {
			expect(read_channel_video({ ...github, status: { ...github.status, privacyStatus } })).toBe(
				null
			);
		}
		for (const liveBroadcastContent of ['upcoming', 'live']) {
			expect(
				read_channel_video({ ...github, snippet: { ...github.snippet, liveBroadcastContent } })
			).toBe(null);
		}
	});

	it('falls back to a smaller picture when an old upload has no maxres one', () => {
		const { maxres: _maxres, standard: _standard, ...thumbnails } = level_up.snippet.thumbnails;
		const video = read_channel_video({ ...level_up, snippet: { ...level_up.snippet, thumbnails } });
		expect(video?.thumbnail).toBe(level_up.snippet.thumbnails.high.url);
	});

	it('dates a stream replay from when it went live, not when it was scheduled', () => {
		const actualStartTime = '2026-11-11T17:00:00Z';
		const video = read_channel_video({ ...github, liveStreamingDetails: { actualStartTime } });
		expect(video?.published_at).toEqual(new Date(actualStartTime));
	});
});
