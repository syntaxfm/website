// Cloudflare edge cache for computed server data that changes rarely (the Snack Pack archive from
// Kit, Sick Picks). Remote functions can't set HTTP headers, so instead of caching their
// responses this caches the data they compute, in the same `caches.default` the Worker uses for
// cached pages. Stale data is served while a fresh copy is computed in the background.
// Under `pnpm dev` (Node) there is no edge cache, so the data is computed every time.
import { getRequestEvent } from '$app/server';
import { PUBLIC_URL } from '$app/env/public';
import { add_timing } from '$server/server_timing';

const FRESH_UNTIL_HEADER = 'x-fresh-until';
const EDGE_CACHE_HOST_PREFIX = 'edge-cache.';

interface EdgeCacheTimes {
	// Served without recomputing for this long
	fresh_seconds: number;
	// Then served as-is while a background refresh runs, for up to this much longer
	stale_seconds: number;
}

// A value's type after a JSON round trip: Dates become ISO strings.
export type Jsonified<T> = T extends Date
	? string
	: T extends string | number | boolean | null | undefined
		? T
		: T extends readonly (infer Item)[]
			? Jsonified<Item>[]
			: T extends object
				? { [Key in keyof T]: Jsonified<T[Key]> }
				: T;

function as_json<T>(value: T): Jsonified<T> {
	return JSON.parse(JSON.stringify(value ?? null)) as Jsonified<T>;
}

// Always returns the JSON copy, cached or not (and under `pnpm dev`), so callers see one shape.
// `compute` should throw rather than return a fallback on failure, so a failure is never cached.
export async function edge_cached<T>(
	key: string,
	{ fresh_seconds, stale_seconds }: EdgeCacheTimes,
	compute: () => Promise<T>
): Promise<Jsonified<T>> {
	const event = getRequestEvent();
	const { platform } = event;
	const cache = platform?.caches?.default;
	if (!cache) return as_json(await compute());
	const lookup_start = performance.now();

	// Its own hostname, so purging the site's pages after a deploy (scripts/purge-beta-cache.ts)
	// keeps this data warm. Data outlives deploys: change the key when a value's shape changes.
	const cache_key = new Request(
		`https://${EDGE_CACHE_HOST_PREFIX}${PUBLIC_URL}/${encodeURIComponent(key)}`
	);

	const refresh = async () => {
		const value = as_json(await compute());
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
	add_timing(
		event,
		cached ? 'edge-cache-hit' : 'edge-cache-miss',
		performance.now() - lookup_start
	);
	if (!cached) return refresh();

	if (Number(cached.headers.get(FRESH_UNTIL_HEADER)) < Date.now()) {
		const background = refresh().catch((error: unknown) => {
			console.error(`edge_cached: background refresh of "${key}" failed`, error);
		});
		if (platform?.ctx) platform.ctx.waitUntil(background);
	}
	return (await cached.json()) as Jsonified<T>;
}
