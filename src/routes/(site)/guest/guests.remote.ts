import * as v from 'valibot';

import { prisma_client } from '$/server/prisma-client';
import { get_show_card_query } from '$/server/shows/shows_queries';
import { query } from '$app/server';

export const getGuest = query(v.string(), async (name_slug) => {
	const show_card_query = get_show_card_query();
	return prisma_client.guest.findUnique({
		where: {
			name_slug
		},
		include: {
			shows: {
				orderBy: {
					showId: 'desc'
				},
				select: {
					Show: {
						...show_card_query
					}
				}
			}
		}
	});
});
