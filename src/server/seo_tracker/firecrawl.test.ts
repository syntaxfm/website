import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BATCH_POLL_INTERVAL_MS, batch_scrape_markdown, fetch_firecrawl } from './firecrawl';

const rate_limited = (retry_after_seconds: number) =>
	Response.json(
		{ success: false, error: 'Rate limit exceeded', retry_after_seconds },
		{ status: 429 }
	);

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('fetch_firecrawl', () => {
	it('waits out the rate limit, then sends the request again', async () => {
		const fetch_fn = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(rate_limited(36))
			.mockResolvedValueOnce(Response.json({ success: true }));

		const pending = fetch_firecrawl('https://api.firecrawl.dev/v2/scrape', {}, fetch_fn);
		await vi.advanceTimersByTimeAsync(35_000);
		expect(fetch_fn).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1_000);

		expect((await pending).status).toBe(200);
		expect(fetch_fn).toHaveBeenCalledTimes(2);
	});

	it('gives back the 429 after three retries', async () => {
		const fetch_fn = vi.fn<typeof fetch>(async () => rate_limited(1));

		const pending = fetch_firecrawl('https://api.firecrawl.dev/v2/scrape', {}, fetch_fn);
		await vi.advanceTimersByTimeAsync(3_000);

		expect((await pending).status).toBe(429);
		expect(fetch_fn).toHaveBeenCalledTimes(4);
	});
});

describe('batch_scrape_markdown', () => {
	const urls = ['https://example.com/a', 'https://example.com/b%20c'];

	it('polls until the batch is done, follows its pages, and keys each page by URL', async () => {
		const fetch_fn = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ success: true, id: 'batch-1' }))
			.mockResolvedValueOnce(Response.json({ success: true, status: 'scraping', data: [] }))
			.mockResolvedValueOnce(
				Response.json({
					success: true,
					status: 'completed',
					creditsUsed: 2,
					next: 'https://api.firecrawl.dev/v2/batch/scrape/batch-1?skip=1',
					data: [{ markdown: '# A', metadata: { sourceURL: urls[1], statusCode: 200 } }]
				})
			)
			.mockResolvedValueOnce(
				Response.json({
					success: true,
					status: 'completed',
					data: [{ markdown: '# B', metadata: { sourceURL: urls[0], statusCode: 200 } }]
				})
			);

		const pending = batch_scrape_markdown(urls, 'key', fetch_fn);
		await vi.advanceTimersByTimeAsync(BATCH_POLL_INTERVAL_MS);
		const result = await pending;

		const [, start] = fetch_fn.mock.calls[0];
		expect(JSON.parse(String(start?.body))).toMatchObject({ urls, maxAge: 0 });
		expect(result).toEqual({
			pages: new Map([
				[urls[0], { ok: true, markdown: '# B' }],
				[urls[1], { ok: true, markdown: '# A' }]
			]),
			credits_cost: 2
		});
	});

	it('throws when the batch fails', async () => {
		const fetch_fn = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ success: true, id: 'batch-1' }))
			.mockResolvedValueOnce(Response.json({ success: true, status: 'failed' }));

		await expect(batch_scrape_markdown(urls, 'key', fetch_fn)).rejects.toThrow(
			'batch scrape failed'
		);
	});
});
