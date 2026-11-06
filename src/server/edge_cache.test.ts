import { beforeEach, describe, expect, it, vi } from 'vitest';

const request_event: { platform?: App.Platform; request: Request } = {
	request: new Request('https://beta.syntax.fm/')
};
vi.mock('$app/server', () => ({ getRequestEvent: () => request_event }));
vi.mock('$app/env/public', () => ({ PUBLIC_URL: 'beta.syntax.fm' }));

const { edge_cached } = await import('./edge_cache');

const TIMES = { fresh_seconds: 60, stale_seconds: 3600 };

// A Cache API stand-in keyed by URL, like caches.default
function make_cache() {
	const entries = new Map<string, Response>();
	return {
		entries,
		match: vi.fn(async (request: Request) => entries.get(request.url)?.clone()),
		put: vi.fn(async (request: Request, response: Response) => {
			entries.set(request.url, response);
		})
	};
}

function use_platform(cache: ReturnType<typeof make_cache>) {
	const waiting: Promise<unknown>[] = [];
	request_event.platform = {
		env: {},
		ctx: { waitUntil: (promise) => waiting.push(promise) },
		caches: { default: cache } as unknown as App.Platform['caches']
	};
	return () => Promise.all(waiting);
}

describe('edge_cached', () => {
	beforeEach(() => {
		request_event.platform = undefined;
		vi.useRealTimers();
	});

	it('computes every time without an edge cache (pnpm dev on Node)', async () => {
		const compute = vi.fn(async () => ({ picks: 1 }));
		await edge_cached('key', TIMES, compute);
		await edge_cached('key', TIMES, compute);
		expect(compute).toHaveBeenCalledTimes(2);
	});

	it('computes and saves on a miss, then serves the saved copy', async () => {
		const cache = make_cache();
		const settle = use_platform(cache);
		const compute = vi.fn(async () => ({ picks: [1, 2] }));

		expect(await edge_cached('sick-picks', TIMES, compute)).toEqual({ picks: [1, 2] });
		await settle();
		expect([...cache.entries.keys()]).toEqual(['https://edge-cache.beta.syntax.fm/sick-picks']);

		expect(await edge_cached('sick-picks', TIMES, compute)).toEqual({ picks: [1, 2] });
		expect(compute).toHaveBeenCalledTimes(1);
	});

	it('serves stale data and refreshes it in the background', async () => {
		const cache = make_cache();
		const settle = use_platform(cache);
		let version = 1;
		const compute = vi.fn(async () => ({ version: version++ }));

		vi.useFakeTimers({ now: 0, toFake: ['Date'] });
		await edge_cached('key', TIMES, compute);
		await settle();

		vi.setSystemTime(61_000);
		expect(await edge_cached('key', TIMES, compute)).toEqual({ version: 1 });
		await settle();
		expect(compute).toHaveBeenCalledTimes(2);
		expect(await edge_cached('key', TIMES, compute)).toEqual({ version: 2 });
	});

	it('never caches a failed computation', async () => {
		const cache = make_cache();
		use_platform(cache);
		const failure = new Error('Kit API 500');

		await expect(edge_cached('key', TIMES, () => Promise.reject(failure))).rejects.toBe(failure);
		expect(cache.put).not.toHaveBeenCalled();
	});
});
