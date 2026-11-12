// Cloudflare edge cache for computed server data that changes rarely (the Snack Pack archive from
// Kit, Sick Picks). Remote functions can't set HTTP headers, so instead of caching their
// responses this caches the data they compute, in the same `caches.default` the Worker uses for
// cached pages. Stale data is served while a fresh copy is computed in the background.
// Under `pnpm dev` (Node) there is no edge cache; see memory_cached.
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

// Under `pnpm dev` there is no edge cache, and computing every time made the Snack Pack page wait
// 2-3 s on Kit at each load. So the last value is kept in memory, served at once and refreshed
// behind every request: as fast as the edge, and a changed query shows on the next reload.
const memory_values = new Map<string, unknown>();
const memory_refreshes = new Map<string, Promise<unknown>>();

async function memory_cached<T>(key: string, compute: () => Promise<T>): Promise<Jsonified<T>> {
	const refresh = () => {
		const running =
			memory_refreshes.get(key) ??
			compute()
				.then((value) => {
					const json = as_json(value);
					memory_values.set(key, json);
					return json;
				})
				.finally(() => memory_refreshes.delete(key));
		memory_refreshes.set(key, running);
		return running as Promise<Jsonified<T>>;
	};

	if (!memory_values.has(key)) return refresh();
	refresh().catch((error: unknown) => {
		console.error(`edge_cached: background refresh of "${key}" failed`, error);
	});
	return memory_values.get(key) as Jsonified<T>;
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
	if (!cache) return memory_cached(key, compute);
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
