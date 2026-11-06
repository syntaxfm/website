import * as v from 'valibot';
import { with_show_card_show } from '$server/shows/shows_queries';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { guest } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const get_guest = query(v.string(), async (name_slug) => {
	return db.query.guest.findFirst({
		where: eq(guest.name_slug, name_slug),
		with: {
			showGuests: {
				with: {
					show: { with: with_show_card_show }
				}
			}
		}
	});
});

// The guest's episodes as feed `content` items — same shape as `get_feed_content`,
// so the guest page renders the identical homepage <FeedItem> cards.
export const get_guest_feed = query(v.string(), async (name_slug) => {
	const found = await db.query.guest.findFirst({
		where: eq(guest.name_slug, name_slug),
		columns: {},
		with: {
			showGuests: {
				columns: {},
				with: { show: { columns: { content_id: true } } }
			}
		}
	});

	const content_ids = (found?.showGuests ?? [])
		.map((show_guest) => show_guest.show?.content_id)
		.filter((id): id is string => Boolean(id));

	if (content_ids.length === 0) return [];

	return db.query.content.findMany({
		where: (c, { inArray }) => inArray(c.id, content_ids),
		orderBy: (c, { desc }) => [desc(c.published_at)],
		with: {
			show: {
				with: {
					guests: { with: { guest: true } },
					hosts: { with: { profile: true } },
					aiShowNote: { with: { topics: true } }
				}
			},
			tags: { with: { tag: true } },
			article: true,
			video: true
		}
	});
});

// Every guest with their episodes (177 guests, 57 KB; Postgres takes 3 ms, the round trip ~100 ms).
// Guests change when an episode comes out.
export const get_all_guests = query(() =>
	edge_cached('all-guests', { fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 7 }, () =>
		db.query.guest.findMany({
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
				showGuests: {
					columns: {},
					with: {
						show: {
							columns: {
								number: true,
								slug: true,
								title: true
							}
						}
					}
				}
			},
			orderBy: (g, { asc }) => [asc(g.name)]
		})
	)
);
