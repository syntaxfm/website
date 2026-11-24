import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { show } from '$server/db/schema';
import { query } from '$app/server';
import { desc } from 'drizzle-orm';
import { is_complete_episode, released_show_clause } from '$server/content/released';

// Shows come out a few times a week. Postgres answers these in under 2 ms; the time was round
// trips and payload (whole show rows), so they select only what's rendered and are edge cached.
const SHOW_LIST_CACHE = { fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 };

// The player bar's starting episode (Player.svelte, browser only, so every full page load asked)
export const get_latest_podcast = query(() =>
	edge_cached('latest-podcast-2', SHOW_LIST_CACHE, async () => {
		const latest = await db.query.show.findFirst({
			columns: { id: true, number: true, title: true, slug: true, url: true, youtube_url: true },
			where: released_show_clause(),
			orderBy: [desc(show.number)]
		});
		return latest && is_complete_episode(latest) ? latest : null;
	})
);
