// Cloudflare edge cache for computed server data that changes rarely (the Snack Pack archive from
// Kit, Sick Picks). Remote functions can't set HTTP headers, so instead of caching their
// responses this caches the data they compute, in the same `caches.default` the Worker uses for
// cached pages. Stale data is served while a fresh copy is computed in the background.
// Under `pnpm dev` (Node) there is no edge cache, so the data is computed every time.
import { getRequestEvent } from '$app/server';
import { PUBLIC_URL } from '$app/env/public';

const FRESH_UNTIL_HEADER = 'x-fresh-until';

interface EdgeCacheTimes {
	// Served without recomputing for this long
	fresh_seconds: number;
	// Then served as-is while a background refresh runs, for up to this much longer
	stale_seconds: number;
}

// `compute` must return JSON-serializable data. It should throw rather than return a fallback on
// failure, so a failure is never cached.
export async function edge_cached<T>(
	key: string,
	{ fresh_seconds, stale_seconds }: EdgeCacheTimes,
	compute: () => Promise<T>
): Promise<T> {
	const { platform } = getRequestEvent();
	const cache = platform?.caches?.default;
	if (!cache) return compute();

	const cache_key = new Request(`https://${PUBLIC_URL}/__edge-cache/${encodeURIComponent(key)}`);

	const refresh = async () => {
		const value = await compute();
		const response = new Response(JSON.stringify(value), {
			headers: {
				'content-type': 'application/json',
				'cache-control': `public, max-age=${fresh_seconds + stale_seconds}`,
				[FRESH_UNTIL_HEADER]: String(Date.now() + fresh_seconds * 1000)
			}
		});
		const saved = cache.put(cache_key, response).catch((error: unknown) => {
			console.error(`edge_cached: could not save "${key}"`, error);
		});
		if (platform?.ctx) platform.ctx.waitUntil(saved);
		else await saved;
		return value;
	};

	const cached = await cache.match(cache_key).catch((error: unknown) => {
		console.error(`edge_cached: could not read "${key}"`, error);
		return undefined;
	});
	if (!cached) return refresh();

	if (Number(cached.headers.get(FRESH_UNTIL_HEADER)) < Date.now()) {
		const background = refresh().catch((error: unknown) => {
			console.error(`edge_cached: background refresh of "${key}" failed`, error);
		});
		if (platform?.ctx) platform.ctx.waitUntil(background);
	}
	return (await cached.json()) as T;
}
