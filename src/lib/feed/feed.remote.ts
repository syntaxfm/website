import { get_last_10_shows } from '$server/shows/shows_queries';
import { query } from '$app/server';
import { db } from '$server/db/client';

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

export const get_most_popular_content_this_week = query(async () => {
	// TODO make this more than just last 10 podcasts
	return db.query.content.findMany({
		orderBy: (c, { desc }) => [desc(c.published_at)],
		limit: 10,
		with: {
			show: true,
			article: true,
			video: true
		}
	});
});
