import { and, asc, count, desc, eq, inArray, isNotNull, lte } from 'drizzle-orm';
import * as v from 'valibot';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { content, content_tags, tag } from '$server/db/schema';
import { edge_cached } from '$server/edge_cache';
import type { PlayerVideo } from '$state/player_utils';
import { get_show_label, VIDEO_LABEL } from '#lib/shows/show_label.ts';
import { get_watch_url_from_url } from '#lib/videos/utils.ts';
import { BROWSE_TYPES, TOPIC_PATTERN, type BrowseType } from './browse_filters';

// /videos: every episode and video, newest first, with filters. Edge cached like the episode list
// it replaced: new content goes out a few times a week.
const BROWSE_CACHE = { fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 };
const TOPICS_CACHE = { fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 7 };
// Enough topics to cover most episodes without a menu that scrolls forever
const TOPIC_COUNT = 24;

const CONTENT_TYPES_BY_BROWSE_TYPE = {
	all: ['PODCAST', 'VIDEO'],
	podcast: ['PODCAST'],
	video: ['VIDEO']
} as const satisfies Record<BrowseType, readonly ('PODCAST' | 'VIDEO')[]>;

// SvelteKit 3 queries can't read the request URL, so the page passes its filters in
const browse_filter_schema = v.object({
	type: v.picklist(BROWSE_TYPES),
	// A tag's slug. Checked here as it ends up in the cache key.
	topic: v.nullable(v.pipe(v.string(), v.regex(TOPIC_PATTERN))),
	order: v.picklist(['asc', 'desc'])
});

const browse_page_schema = v.object({
	...browse_filter_schema.entries,
	page: v.pipe(v.number(), v.integer(), v.minValue(1)),
	per_page: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))
});

type BrowseFilters = v.InferOutput<typeof browse_filter_schema>;

function browse_where({ type, topic }: BrowseFilters) {
	return and(
		eq(content.status, 'PUBLISHED'),
		inArray(content.type, [...CONTENT_TYPES_BY_BROWSE_TYPE[type]]),
		// Episodes are imported ahead of their release date
		lte(content.published_at, new Date()),
		topic
			? inArray(
					content.id,
					db
						.select({ id: content_tags.content_id })
						.from(content_tags)
						.innerJoin(tag, eq(tag.id, content_tags.tag_id))
						.where(eq(tag.slug, topic))
				)
			: undefined
	);
}

function filters_cache_key({ type, topic, order }: BrowseFilters) {
	return `${type}-${topic ?? 'any'}-${order}`;
}

// What the cards render (Show.svelte, ShowThumbnail.svelte): an episode, or a video as the player
// takes it
type BrowseEpisode = {
	title: string;
	slug: string;
	number: number;
	url: string;
	youtube_url: string | null;
	date: Date;
	show: string;
};
type BrowseVideo = PlayerVideo & { date: Date; show: string };
export type BrowseItem = BrowseEpisode | BrowseVideo;

export const get_browse_items = query(browse_page_schema, (filters) =>
	edge_cached(
		`browse-${filters_cache_key(filters)}-${filters.page}-${filters.per_page}`,
		BROWSE_CACHE,
		async (): Promise<BrowseItem[]> => {
			const rows = await db.query.content.findMany({
				columns: { title: true, slug: true, published_at: true },
				with: {
					show: {
						columns: {
							number: true,
							title: true,
							slug: true,
							url: true,
							youtube_url: true,
							show_type: true,
							date: true
						}
					},
					video: { columns: { id: true } }
				},
				where: browse_where(filters),
				orderBy: [filters.order === 'asc' ? asc(content.published_at) : desc(content.published_at)],
				limit: filters.per_page,
				offset: (filters.page - 1) * filters.per_page
			});

			return rows.flatMap((row): BrowseItem[] => {
				if (row.show) {
					const { show } = row;
					return [
						{
							title: show.title,
							slug: show.slug,
							number: show.number,
							url: show.url,
							youtube_url: show.youtube_url,
							date: show.date,
							show: get_show_label(show)
						}
					];
				}
				if (row.video && row.published_at) {
					return [
						{
							kind: 'VIDEO',
							title: row.title,
							slug: row.slug,
							youtube_url: get_watch_url_from_url(row.video.id),
							date: row.published_at,
							show: VIDEO_LABEL
						}
					];
				}
				return [];
			});
		}
	)
);

export const count_browse_items = query(browse_filter_schema, (filters) =>
	edge_cached(`browse-count-${filters_cache_key(filters)}`, BROWSE_CACHE, async () => {
		const [result] = await db.select({ count: count() }).from(content).where(browse_where(filters));
		return result.count;
	})
);

// The topic menu: the curated topics (src/server/tags) on the most episodes and videos
export const get_browse_topics = query(() =>
	edge_cached('browse-topics-2', TOPICS_CACHE, async () => {
		const rows = await db
			.select({ name: tag.name, slug: tag.slug, uses: count(content_tags.content_id) })
			.from(content_tags)
			.innerJoin(tag, eq(tag.id, content_tags.tag_id))
			.innerJoin(content, eq(content.id, content_tags.content_id))
			.where(
				and(
					eq(content.status, 'PUBLISHED'),
					inArray(content.type, [...CONTENT_TYPES_BY_BROWSE_TYPE.all]),
					eq(tag.kind, 'TOPIC'),
					isNotNull(tag.slug)
				)
			)
			.groupBy(tag.id, tag.name, tag.slug)
			.orderBy(desc(count(content_tags.content_id)))
			.limit(TOPIC_COUNT);
		return rows.flatMap(({ name, slug }) => (slug ? [{ name, slug }] : []));
	})
);
