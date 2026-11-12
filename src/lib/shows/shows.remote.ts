import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { show } from '$server/db/schema';
import { query } from '$app/server';
import { asc, desc, count } from 'drizzle-orm';
import * as v from 'valibot';

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

// SvelteKit 3 queries can't read the request URL, so the Shows page passes its filters in.
const podcast_list_schema = v.object({
	page: v.pipe(v.number(), v.integer(), v.minValue(1)),
	order: v.picklist(['asc', 'desc']),
	per_page: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))
});

// Only what the episode cards render (Show.svelte, ShowThumbnail.svelte). Whole rows with every
// guest, host and AI note were 156 KB for 29 shows.
export const get_all_podcasts = query(podcast_list_schema, ({ page, order, per_page }) =>
	edge_cached(`podcasts-${order}-${page}-${per_page}`, SHOW_LIST_CACHE, () =>
		db.query.show.findMany({
			columns: {
					number: true,
					title: true,
					slug: true,
					date: true,
					url: true,
					youtube_url: true,
					show_type: true
				},
			limit: per_page,
			offset: (page - 1) * per_page,
			orderBy: [order === 'desc' ? desc(show.number) : asc(show.number)],
			where: (show, { lte }) => lte(show.date, new Date())
		})
	)
);
