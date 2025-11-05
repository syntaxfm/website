import { desc, lte } from 'drizzle-orm';
import { shows } from '$server/db/schema';

export const shows_api_query = () => ({
	orderBy: desc(shows.number),
	with: {
		guests: {
			with: {
				guest: {
					columns: {
						github: true,
						name: true
					}
				}
			}
		}
	},
	where: lte(shows.date, new Date())
});
