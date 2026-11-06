// Per-request timing, sent in the Server-Timing header (hooks.server.ts) so every document, page
// data and remote function request shows where its server time went in DevTools' Timing tab:
// `auth` (Syntax Auth session check + Profile lookup), `db` (every database query) and `app`
// (the whole request).
import type { RequestEvent } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

interface Timing {
	count: number;
	// Summed per measurement. Database queries that run in parallel overlap, so `db` can exceed
	// the request's wall time.
	total_ms: number;
	slowest_ms: number;
}

// Keyed by the Request: inside remote functions getRequestEvent() returns a wrapper around the
// event the hooks see, but both share the same Request object.
const timings = new WeakMap<Request, Map<string, Timing>>();

export function add_timing(event: RequestEvent, name: string, ms: number) {
	const by_name = timings.get(event.request) ?? new Map<string, Timing>();
	const timing = by_name.get(name) ?? { count: 0, total_ms: 0, slowest_ms: 0 };
	timing.count += 1;
	timing.total_ms += ms;
	timing.slowest_ms = Math.max(timing.slowest_ms, ms);
	by_name.set(name, timing);
	timings.set(event.request, by_name);
}

export function server_timing_header(event: RequestEvent, app_ms: number): string {
	const entries = [...(timings.get(event.request) ?? [])].map(
		([name, { count, total_ms, slowest_ms }]) =>
			`${name};dur=${total_ms.toFixed(1)};desc="${count}x, slowest ${slowest_ms.toFixed(1)}ms"`
	);
	return [...entries, `app;dur=${app_ms.toFixed(1)}`].join(', ');
}

function current_event(): RequestEvent | null {
	try {
		return getRequestEvent();
	} catch {
		// Outside a request (startup, scripts)
		return null;
	}
}

// postgres.js queries run when awaited, so this wraps `then` to time from await to settle (which
// includes waiting for the connection). The query object itself is returned, so chained calls
// like `.values()` keep working.
export function time_query<Q extends PromiseLike<unknown>>(query: Q): Q {
	const event = current_event();
	if (!event) return query;
	const original_then = query.then.bind(query);
	Object.defineProperty(query, 'then', {
		configurable: true,
		value: (
			on_fulfilled?: ((value: unknown) => unknown) | null,
			on_rejected?: ((reason: unknown) => unknown) | null
		) => {
			const start = performance.now();
			return original_then(
				(value) => {
					add_timing(event, 'db', performance.now() - start);
					return on_fulfilled ? on_fulfilled(value) : value;
				},
				(reason: unknown) => {
					add_timing(event, 'db', performance.now() - start);
					if (on_rejected) return on_rejected(reason);
					throw reason;
				}
			);
		}
	});
	return query;
}
