import { and, count, desc, eq, gte } from 'drizzle-orm';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { get_views_per_day, get_youtube_view_counts } from '$server/video/youtube_views';
import { content, content_tags, tag } from '$server/db/schema';
import {
	get_id_from_url,
	get_thumbnail_from_id,
	get_thumbnail_srcset_from_id
} from '#lib/videos/utils.ts';
import get_show_path from '$utilities/slug';
import type { RankedContent } from '#lib/sidebar/ranked.ts';
import { get_show_label } from '#lib/shows/show_label.ts';
import { feed_card_query } from './feed_queries';

// Cached at the edge: new content goes out a few times a week, and the query took 180-420 ms.
export const get_feed_content = query(() =>
	edge_cached('home-feed', { fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 }, () =>
		db.query.content.findMany({
			...feed_card_query,
			orderBy: (c, { desc }) => [desc(c.published_at)],
			limit: 100
		})
	)
);

// The sidebar beside every feed and on show pages. Only what RankedItem renders, edge cached for
// an hour: views move slowly, and every refresh spends YouTube API quota.
export const get_most_popular_content_this_week = query(() =>
	edge_cached(
		'most-popular-by-views-per-day',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 },
		load_most_popular_content
	)
);

// About six weeks of episodes: two a week
const RECENT_EPISODES_TO_RANK = 12;
const RANKED_ITEMS = 6;

// The recent episodes with the most YouTube views per day since release, so a new episode isn't
// outranked by one that has simply been up longer. The site doesn't count plays itself.
async function load_most_popular_content(): Promise<RankedContent[]> {
	const items = await load_recent_episodes();
	const youtube_ids = items.flatMap(({ youtube_id }) => (youtube_id ? [youtube_id] : []));

	let views = new Map<string, number>();
	try {
		views = await get_youtube_view_counts(youtube_ids);
	} catch (error) {
		// Newest first rather than an empty sidebar, until the next refresh
		console.error('Could not rank the most popular episodes by YouTube views', error);
	}

	const now = Date.now();
	const views_per_day = (item: (typeof items)[number]) =>
		get_views_per_day(views.get(item.youtube_id) ?? 0, item.date, now);

	return items
		.toSorted((a, b) => views_per_day(b) - views_per_day(a))
		.slice(0, RANKED_ITEMS)
		.map(({ youtube_id: _, ...item }) => item);
}

async function load_recent_episodes(): Promise<(RankedContent & { youtube_id: string })[]> {
	const rows = await db.query.content.findMany({
		columns: { id: true, title: true, published_at: true },
		where: (c, { eq }) => eq(c.status, 'PUBLISHED'),
		orderBy: (c, { desc }) => [desc(c.published_at)],
		limit: RECENT_EPISODES_TO_RANK,
		with: {
			show: {
				columns: { number: true, slug: true, date: true, youtube_url: true, show_type: true },
				with: {
					guests: { columns: {}, with: { guest: { columns: { name: true } } } },
					hosts: { columns: {}, with: { profile: { columns: { name: true } } } }
				}
			}
		}
	});

	const items: (RankedContent & { youtube_id: string })[] = [];
	for (const row of rows) {
		const { show } = row;
		if (!show) continue;

		const youtube_id = show.youtube_url ? get_id_from_url(show.youtube_url) : '';
		const guests = show.guests
			.map(({ guest }) => guest?.name)
			.filter((name): name is string => Boolean(name));
		const hosts = show.hosts
			.map(({ profile }) => profile?.name)
			.filter((name): name is string => Boolean(name));

		items.push({
			id: row.id,
			title: row.title,
			href: get_show_path({ number: show.number, slug: show.slug }),
			series: get_show_label(show),
			number: show.number,
			thumbnail: youtube_id ? get_thumbnail_from_id(youtube_id) : null,
			thumbnail_srcset: youtube_id ? get_thumbnail_srcset_from_id(youtube_id) : null,
			date: (row.published_at ?? show.date).toISOString(),
			people: [...guests, ...hosts],
			youtube_id
		});
	}

	return items;
}

// Two aggregate queries (220-520 ms) for a sidebar that changes when content is published
export const get_trending_tags = query(() =>
	edge_cached(
		'trending-tags',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 7 },
		load_trending_tags
	)
);

async function load_trending_tags(): Promise<{ name: string; slug: string | null }[]> {
	const ninety_days_ago = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

	// Both at once: each query is a ~100 ms round trip to the database (Postgres itself takes 2 ms),
	// and the recent one currently finds nothing, so running them one after the other cost two.
	const [recent, all_time] = await Promise.all([
		db
			.select({ name: tag.name, slug: tag.slug, uses: count(content_tags.content_id) })
			.from(content_tags)
			.innerJoin(tag, eq(tag.id, content_tags.tag_id))
			.innerJoin(content, eq(content.id, content_tags.content_id))
			.where(and(eq(content.status, 'PUBLISHED'), gte(content.published_at, ninety_days_ago)))
			.groupBy(tag.id, tag.name, tag.slug)
			.orderBy(desc(count(content_tags.content_id)))
			.limit(20),
		// Fallback while the content migration is still backfilling recent tags.
		db
			.select({ name: tag.name, slug: tag.slug, uses: count(content_tags.content_id) })
			.from(content_tags)
			.innerJoin(tag, eq(tag.id, content_tags.tag_id))
			.groupBy(tag.id, tag.name, tag.slug)
			.orderBy(desc(count(content_tags.content_id)))
			.limit(20)
	]);

	const tags = recent.length >= 5 ? recent : all_time;
	return tags.map((row) => ({ name: row.name, slug: row.slug }));
}
