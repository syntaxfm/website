import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { query } from '$app/server';
import { asc, desc, count } from 'drizzle-orm';
import * as v from 'valibot';

export const get_latest_podcast = query(async () => {
	// TODO make this more than just last 10 podcasts
	return db.query.show.findFirst({
		orderBy: [desc(show.number)]
	});
});

export const count_podcasts = query(async () => {
	const result = await db.select({ count: count() }).from(show);
	return result[0].count;
});

// SvelteKit 3 queries can't read the request URL, so the Shows page passes its filters in.
const podcast_list_schema = v.object({
	page: v.pipe(v.number(), v.integer(), v.minValue(1)),
	order: v.picklist(['asc', 'desc']),
	per_page: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))
});

export const get_all_podcasts = query(podcast_list_schema, async ({ page, order, per_page }) => {
	const offset = (page - 1) * per_page;

	return db.query.show.findMany({
		limit: per_page,
		offset,
		orderBy: [order === 'desc' ? desc(show.number) : asc(show.number)],
		where: (show, { lte }) => lte(show.date, new Date()),
		with: {
			guests: true,
			hosts: true,
			aiShowNote: {
				columns: {
					description: true
				},
				with: {
					topics: true
				}
			}
		}
	});
});
