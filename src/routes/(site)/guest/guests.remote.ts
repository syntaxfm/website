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
			show: {
				orderBy: (showGuest, { desc }) => [desc(showGuest.showId)],
				with: {
					show: with_show_card_show
				}
			}
		}
	});
});

export const getAllGuests = query(async () => {
	const guests = await db.query.guest.findMany({
		with: {
			shows: {
				with: {
					show: {
						with: {
							guests: {
								with: {
									guest: {
										columns: {
											name: true,
											of: true,
											name_slug: true,
											id: true,
											github: true,
											url: true,
											twitter: true
										}
									}
								}
							}
						}
					}
				}
			}
		}
	});
	return guests;
});
