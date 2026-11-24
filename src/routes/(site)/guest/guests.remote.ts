import { in_order_added } from '#lib/utils/in_order_added.ts';
import * as v from 'valibot';
import { with_show_card_show } from '$server/shows/shows_queries';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { guest } from '$server/db/schema';
import {
	has_show_number,
	is_complete_episode,
	is_released,
	released_content_clause,
	with_complete_show
} from '$server/content/released';
import { eq } from 'drizzle-orm';

// A guest booked on a scheduled episode isn't shown until that episode is out: the relation from a
// guest to their episodes can't be filtered in the query, so released episodes are kept here.

/** The guest and their released episodes. Null when they have none yet. */
export const get_guest = query(v.string(), async (name_slug) => {
	const found = await db.query.guest.findFirst({
		where: eq(guest.name_slug, name_slug),
		with: {
			appearances: {
				with: {
					content: { columns: { status: true, published_at: true } },
					show: { with: with_show_card_show }
				}
			}
		}
	});
	if (!found) return null;
	const released = found.appearances.flatMap(({ content: content_meta, show, ...show_guest }) =>
		is_released(content_meta) && show && is_complete_episode(show) ? [{ ...show_guest, show }] : []
	);
	return released.length > 0 ? { ...found, appearances: released } : null;
});

// The guest's episodes as feed `content` items — same shape as `get_feed_content`,
// so the guest page renders the identical homepage <FeedItem> cards.
export const get_guest_feed = query(v.string(), async (name_slug) => {
	const found = await db.query.guest.findFirst({
		where: eq(guest.name_slug, name_slug),
		columns: {},
		with: {
			appearances: { columns: { content_id: true } }
		}
	});

	const content_ids = (found?.appearances ?? []).map((appearance) => appearance.content_id);

	if (content_ids.length === 0) return [];

	const rows = await db.query.content.findMany({
		where: (c, { and, inArray }) => and(inArray(c.id, content_ids), released_content_clause()),
		orderBy: (c, { desc }) => [desc(c.published_at)],
		with: {
			show: {
				with: {
					guests: { orderBy: in_order_added, with: { guest: true } },
					hosts: { orderBy: in_order_added, with: { profile: true } },
					aiShowNote: { with: { topics: true } }
				}
			},
			tags: { with: { tag: true } },
			article: true,
			video: true
		}
	});
	return rows.map(with_complete_show);
});

// Every guest with their released episodes (177 guests, 57 KB; Postgres takes 3 ms, the round trip
// ~100 ms). Guests change when an episode comes out.
export const get_all_guests = query(() =>
	edge_cached(
		'all-guests-4',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 7 },
		async () => {
			const guests = await db.query.guest.findMany({
				columns: {
					id: true,
					name: true,
					name_slug: true,
					of: true,
					github: true,
					twitter: true,
					url: true
				},
				with: {
					appearances: {
						columns: {},
						with: {
							content: { columns: { status: true, published_at: true } },
							show: {
								columns: {
									number: true,
									slug: true,
									title: true,
									date: true
								}
							}
						}
					}
				},
				orderBy: (g, { asc }) => [asc(g.name)]
			});
			return guests.flatMap((found) => {
				const released = found.appearances.flatMap(({ content: content_meta, show }) =>
					is_released(content_meta) && show && has_show_number(show) ? [{ show }] : []
				);
				return released.length > 0 ? [{ ...found, appearances: released }] : [];
			});
		}
	)
);
