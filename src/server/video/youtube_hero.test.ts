import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({ YOUTUBE_API_KEY: undefined }));
vi.mock('$server/edge_cache', () => ({ edge_cached: vi.fn() }));

import { YOUTUBE_CHANNEL_ID } from '$const';
import { pick_hero_video, type YouTubeVideoItem } from './youtube_hero';

function upload(id: string, overrides: Partial<YouTubeVideoItem> = {}): YouTubeVideoItem {
	return {
		id,
		snippet: {
			channelId: YOUTUBE_CHANNEL_ID,
			title: `Video ${id}`,
			publishedAt: '2026-11-04T14:00:00Z',
			liveBroadcastContent: 'none',
			tags: ['css', 'svelte', 'ai', 'extra']
		},
		contentDetails: { duration: 'PT58M12S' },
		status: { embeddable: true, privacyStatus: 'public' },
		...overrides
	};
}

function snippet(overrides: NonNullable<YouTubeVideoItem['snippet']>) {
	return { ...upload('x').snippet, ...overrides };
}

describe('pick_hero_video', () => {
	it('picks the newest released video when nothing is live', () => {
		const video = pick_hero_video([
			upload('older', { snippet: snippet({ publishedAt: '2026-11-02T14:00:00Z' }) }),
			upload('newest', { snippet: snippet({ publishedAt: '2026-11-06T14:00:00Z' }) }),
			upload('middle')
		]);

		expect(video).toEqual({
			id: 'newest',
			title: 'Video x',
			url: 'https://www.youtube.com/watch?v=newest',
			is_live: false,
			started_at: '2026-11-06T14:00:00Z',
			labels: ['css', 'svelte', 'ai']
		});
	});

	it('picks the live stream over a newer video', () => {
		const video = pick_hero_video([
			upload('newer', { snippet: snippet({ publishedAt: '2026-11-09T18:00:00Z' }) }),
			upload('stream', {
				snippet: snippet({ liveBroadcastContent: 'live' }),
				// A stream has no length until it ends
				contentDetails: { duration: 'P0D' },
				liveStreamingDetails: { actualStartTime: '2026-11-09T17:00:00Z' }
			})
		]);

		expect(video?.id).toBe('stream');
		expect(video?.is_live).toBe(true);
		expect(video?.started_at).toBe('2026-11-09T17:00:00Z');
	});

	it('skips Shorts', () => {
		const video = pick_hero_video([
			upload('short', {
				snippet: snippet({ publishedAt: '2026-11-06T14:00:00Z' }),
				contentDetails: { duration: 'PT2M59S' }
			}),
			upload('long')
		]);

		expect(video?.id).toBe('long');
	});

	it('dates a stream replay from when it aired, not from when it was scheduled', () => {
		const video = pick_hero_video([
			upload('video', { snippet: snippet({ publishedAt: '2026-11-04T14:00:00Z' }) }),
			upload('replay', {
				snippet: snippet({ publishedAt: '2026-11-01T09:00:00Z' }),
				liveStreamingDetails: {
					actualStartTime: '2026-11-09T17:00:00Z',
					actualEndTime: '2026-11-09T18:30:00Z'
				}
			})
		]);

		expect(video?.id).toBe('replay');
		expect(video?.is_live).toBe(false);
		expect(video?.started_at).toBe('2026-11-09T17:00:00Z');
	});

	it('skips what visitors could not watch here', () => {
		const video = pick_hero_video([
			upload('scheduled', { snippet: snippet({ liveBroadcastContent: 'upcoming' }) }),
			upload('unlisted', { status: { embeddable: true, privacyStatus: 'unlisted' } }),
			upload('no-embed', { status: { embeddable: false, privacyStatus: 'public' } }),
			upload('other-channel', { snippet: snippet({ channelId: 'UCsomeone-else' }) })
		]);

		expect(video).toBeNull();
	});

	it('has nothing to show for an empty channel', () => {
		expect(pick_hero_video([])).toBeNull();
	});
});
