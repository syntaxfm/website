import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { getRequestEvent, query } from '$app/server';
import { asc, desc, count } from 'drizzle-orm';

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

export const get_all_podcasts = query(async () => {
	const { url } = getRequestEvent();
	const page_number = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
	const order = url.searchParams.get('order') || 'desc';
	const per_page = Math.max(1, parseInt(url.searchParams.get('perPage') || '29') || 29);
	const offset = (page_number - 1) * per_page;

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
