import { and, count, desc, eq, gte } from 'drizzle-orm';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { content, content_tags, tag } from '$server/db/schema';
import {
	get_id_from_url,
	get_thumbnail_from_id,
	get_thumbnail_srcset_from_id
} from '#lib/videos/utils.ts';
import get_show_path from '$utilities/slug';
import type { RankedContent } from '#lib/sidebar/ranked.ts';

// Only what the feed cards render (FeedItemPodcast, FeedHosts, ShowThumbnail, FeedItemVideo).
// Selecting whole rows sent show notes, search vectors and AI notes: 494 KB per call.
// Cached at the edge: new content goes out a few times a week, and the query took 180-420 ms.
export const get_feed_content = query(() =>
	edge_cached('home-feed', { fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 }, () =>
		db.query.content.findMany({
			columns: { id: true, type: true },
			orderBy: (c, { desc }) => [desc(c.published_at)],
			limit: 100,
			with: {
				show: {
					columns: { number: true, title: true, slug: true, url: true, youtube_url: true },
					with: {
						guests: { columns: {}, with: { guest: { columns: { name: true, github: true } } } },
						hosts: {
							columns: {},
							with: { profile: { columns: { name: true, username: true } } }
						}
					}
				},
				tags: { columns: {}, with: { tag: { columns: { name: true, slug: true } } } },
				video: { columns: { title: true } }
			}
		})
	)
);

// The show page sidebar. Was every show card field (22 KB, ~110 ms uncached); now only what
// RankedItem renders, edge cached like the feed.
export const get_most_popular_content_this_week = query(() =>
	edge_cached(
		'most-popular-this-week',
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		load_most_popular_content
	)
);

async function load_most_popular_content(): Promise<RankedContent[]> {
	// TODO: rank by real popularity once we track it; for now, the most recent published podcasts.
	const rows = await db.query.content.findMany({
		columns: { id: true, title: true, published_at: true },
		where: (c, { eq }) => eq(c.status, 'PUBLISHED'),
		orderBy: (c, { desc }) => [desc(c.published_at)],
		limit: 6,
		with: {
			show: {
				columns: { number: true, slug: true, date: true, youtube_url: true },
				with: {
					guests: { columns: {}, with: { guest: { columns: { name: true } } } },
					hosts: { columns: {}, with: { profile: { columns: { name: true } } } }
				}
			}
		}
	});

	const items: RankedContent[] = [];
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
			series: 'Syntax Podcast',
			number: show.number,
			thumbnail: youtube_id ? get_thumbnail_from_id(youtube_id) : null,
			thumbnail_srcset: youtube_id ? get_thumbnail_srcset_from_id(youtube_id) : null,
			date: (row.published_at ?? show.date).toISOString(),
			people: [...guests, ...hosts]
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
