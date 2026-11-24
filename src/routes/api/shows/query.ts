import { in_order_added } from '#lib/utils/in_order_added.ts';
import { desc, lte } from 'drizzle-orm';
import { show as shows } from '$server/db/schema';

export const shows_api_query = () => ({
	orderBy: desc(shows.number),
	with: {
		guests: {
			orderBy: in_order_added,
			columns: { guest_id: true },
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
