import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { show } from '$server/db/schema';
import { query } from '$app/server';
import { desc, count } from 'drizzle-orm';

// Shows come out a few times a week. Postgres answers these in under 2 ms; the time was round
// trips and payload (whole show rows), so they select only what's rendered and are edge cached.
const SHOW_LIST_CACHE = { fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 };

// The player bar's starting episode (Player.svelte, browser only, so every full page load asked)
export const get_latest_podcast = query(() =>
	edge_cached('latest-podcast', SHOW_LIST_CACHE, async () => {
		const latest = await db.query.show.findFirst({
			columns: { id: true, number: true, title: true, slug: true, url: true, youtube_url: true },
			orderBy: [desc(show.number)]
		});
		return latest ?? null;
	})
);

export const count_podcasts = query(() =>
	edge_cached('podcast-count', SHOW_LIST_CACHE, async () => {
		const result = await db.select({ count: count() }).from(show);
		return result[0].count;
	})
);
