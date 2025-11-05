import { db } from '$server/db/client';
import { show } from '$server/db/schema';

import { gt, lt, asc, desc } from 'drizzle-orm';

export const load = async () => {
	const today = new Date();

	const next_shows = await db.query.show.findMany({
		where: gt(show.date, today),
		with: {
			aiShowNote: {
				with: {
					topics: true
				}
			}
		},
		orderBy: [asc(show.date)],
		limit: 9
	});

	const last_9_shows = await db.query.show.findMany({
		where: lt(show.date, today),
		with: {
			aiShowNote: {
				with: {
					topics: true
				}
			}
		},
		orderBy: [desc(show.date)],
		limit: 9
	});

	return {
		next_shows,
		last_9_shows
	};
};
