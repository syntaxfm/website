import * as v from 'valibot';
import { with_show_card_show } from '$server/shows/shows_queries';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { guest } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const getGuest = query(v.string(), async (name_slug) => {
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

export const getAllGuests = query(async () => {
	return db.query.guest.findMany({
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
	});
});
