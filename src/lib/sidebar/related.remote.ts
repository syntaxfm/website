import * as v from 'valibot';
import { query } from '$app/server';
import type { Path } from '$app/types';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { find_related_content_ids } from '$server/tags/related';
import get_show_path from '$utilities/slug';
import { get_show_label, VIDEO_LABEL } from '#lib/shows/show_label.ts';
import {
	get_id_from_url,
	get_thumbnail_from_id,
	get_thumbnail_srcset_from_id
} from '#lib/videos/utils.ts';
import { feed_card_query } from '../feed/feed_queries';
import type { RankedContent } from './ranked';

// A few spare, so the sidebar can drop ones Most Popular already shows and still have enough
const RELATED_CANDIDATES = 10;

function thumbnail_fields(youtube_id: string) {
	return youtube_id
		? {
				thumbnail: get_thumbnail_from_id(youtube_id),
				thumbnail_srcset: get_thumbnail_srcset_from_id(youtube_id)
			}
		: { thumbnail: null, thumbnail_srcset: null };
}

async function load_related_content(content_id: string): Promise<RankedContent[]> {
	const ids = await find_related_content_ids(content_id, RELATED_CANDIDATES);
	if (ids.length === 0) return [];

	const rows = await db.query.content.findMany({
		...feed_card_query,
		where: (c, { inArray }) => inArray(c.id, ids)
	});
	// Back in the scoring order
	const rank = new Map(ids.map((id, index) => [id, index] as const));
	const sorted = rows.toSorted((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

	const items: RankedContent[] = [];
	for (const row of sorted) {
		const { show, video } = row;
		if (show) {
			const people = [
				...show.guests.map(({ guest }) => guest?.name),
				...show.hosts.map(({ profile }) => profile?.name)
			].filter((name): name is string => Boolean(name));
			items.push({
				id: row.id,
				title: show.title,
				href: get_show_path(show),
				series: get_show_label(show),
				number: show.number,
				...thumbnail_fields(get_id_from_url(show.youtube_url)),
				date: (row.published_at ?? show.date).toISOString(),
				people
			});
		} else if (video && row.published_at) {
			const path: Path = `/videos/${row.slug}`;
			items.push({
				id: row.id,
				title: row.title,
				href: path,
				series: VIDEO_LABEL,
				number: null,
				...thumbnail_fields(video.id),
				date: row.published_at.toISOString(),
				people: []
			});
		}
	}
	return items;
}

// The sidebar's related episodes and videos. Cached for an hour: tags change when content is tagged.
export const get_related_content = query(v.pipe(v.string(), v.uuid()), (content_id) =>
	edge_cached(
		`related-${content_id}`,
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 },
		() => load_related_content(content_id)
	)
);
