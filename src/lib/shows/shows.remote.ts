import { db } from '$/db/client';
import { shows } from '$/db/schema';
import { query } from '$app/server';
import { desc } from 'drizzle-orm';

export const get_latest_podcast = query(async () => {
	// TODO make this more than just last 10 podcasts
	return db.query.shows.findFirst({
		orderBy: [desc(shows.number)]
	});
});

export const count_podcasts = query(async () => {
	const { count } = await import('drizzle-orm');
	const result = await db.select({ count: count() }).from(shows);
	return result[0].count;
});
