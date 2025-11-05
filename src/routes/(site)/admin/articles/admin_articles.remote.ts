import { query } from '$app/server';
import { db } from '$server/db/client';

export const get_all_articles = query(async () => {
	return db.query.article.findMany({
		with: {
			meta: true
		}
	});
});
