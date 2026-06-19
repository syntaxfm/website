import { and, count, desc, eq, gte } from 'drizzle-orm';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { content, content_tags, tag } from '$server/db/schema';
import { with_show_card_show } from '$server/shows/shows_queries';
import { get_id_from_url, get_thumbnail_from_id } from '$lib/videos/utils';
import get_show_path from '$utilities/slug';
import type { RankedContent } from '$lib/sidebar/ranked';

export const get_feed_content = query(() => {
	return db.query.content.findMany({
		orderBy: (c, { desc }) => [desc(c.published_at)],
		limit: 100,
		with: {
			show: {
				with: {
					guests: { with: { guest: true } },
					hosts: true,
					aiShowNote: {
						with: {
							topics: true
						}
					}
				}
			},
			tags: {
				with: {
					tag: true
				}
			},
			article: true,
			video: true
		}
	});
});

export const get_most_popular_content_this_week = query(async (): Promise<RankedContent[]> => {
	// TODO: rank by real popularity once we track it; for now, the most recent published podcasts.
	const rows = await db.query.content.findMany({
		where: (c, { eq }) => eq(c.status, 'PUBLISHED'),
		orderBy: (c, { desc }) => [desc(c.published_at)],
		limit: 6,
		with: {
			show: { with: with_show_card_show }
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
			.map(({ user }) => user?.name)
			.filter((name): name is string => Boolean(name));

		items.push({
			id: row.id,
			title: row.title,
			href: get_show_path({ number: show.number, slug: show.slug }),
			series: 'Syntax Podcast',
			number: show.number,
			thumbnail: youtube_id ? get_thumbnail_from_id(youtube_id) : null,
			date: row.published_at ?? show.date,
			people: [...guests, ...hosts]
		});
	}

	return items;
});

export const get_trending_tags = query(async (): Promise<string[]> => {
	const ninety_days_ago = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

	const recent = await db
		.select({ name: tag.name, uses: count(content_tags.content_id) })
		.from(content_tags)
		.innerJoin(tag, eq(tag.id, content_tags.tag_id))
		.innerJoin(content, eq(content.id, content_tags.content_id))
		.where(and(eq(content.status, 'PUBLISHED'), gte(content.published_at, ninety_days_ago)))
		.groupBy(tag.id, tag.name)
		.orderBy(desc(count(content_tags.content_id)))
		.limit(20);

	if (recent.length >= 5) {
		return recent.map((row) => row.name);
	}

	// Fallback while the content migration is still backfilling recent tags.
	const all_time = await db
		.select({ name: tag.name, uses: count(content_tags.content_id) })
		.from(content_tags)
		.innerJoin(tag, eq(tag.id, content_tags.tag_id))
		.groupBy(tag.id, tag.name)
		.orderBy(desc(count(content_tags.content_id)))
		.limit(20);

	return all_time.map((row) => row.name);
});
