import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({ YOUTUBE_API_KEY: 'test-key' }));

const { get_views_per_day, get_youtube_view_counts } = await import('./youtube_views');

describe('get_views_per_day', () => {
	const now = Date.parse('2026-11-12T12:00:00Z');

	it('ranks a new episode above an older one with more total views', () => {
		const new_episode = get_views_per_day(9_000, '2026-11-09T12:00:00Z', now);
		const old_episode = get_views_per_day(30_000, '2026-10-13T12:00:00Z', now);
		expect(new_episode).toBe(3_000);
		expect(old_episode).toBe(1_000);
	});

	it('counts an episode out for under a day as one day', () => {
		expect(get_views_per_day(500, '2026-11-12T11:00:00Z', now)).toBe(500);
	});
});

function youtube_returns(body: unknown, status = 200) {
	return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe('get_youtube_view_counts', () => {
	it('reads every view count in one call', async () => {
		const fetcher = youtube_returns({
			items: [
				{ id: 'a', statistics: { viewCount: '1200' } },
				{ id: 'b', statistics: { viewCount: '87' } }
			]
		});

		const views = await get_youtube_view_counts(['a', 'b', 'gone'], fetcher);

		expect(views).toEqual(
			new Map([
				['a', 1200],
				['b', 87]
			])
		);
		expect(fetcher).toHaveBeenCalledTimes(1);
		const [url] = fetcher.mock.calls[0] as unknown as [URL];
		expect(url.searchParams.get('id')).toBe('a,b,gone');
		expect(url.searchParams.get('part')).toBe('statistics');
	});

	it('leaves out a video with no view count', async () => {
		const fetcher = youtube_returns({ items: [{ id: 'hidden', statistics: {} }] });
		expect(await get_youtube_view_counts(['hidden'], fetcher)).toEqual(new Map());
	});

	it('asks YouTube nothing for no videos', async () => {
		const fetcher = youtube_returns({});
		expect(await get_youtube_view_counts([], fetcher)).toEqual(new Map());
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('throws when YouTube fails', async () => {
		const fetcher = youtube_returns({ error: 'quota' }, 403);
		await expect(get_youtube_view_counts(['a'], fetcher)).rejects.toThrow('403');
	});
});
