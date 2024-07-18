import { prisma_client } from '$/hooks.server';
import { get_show_card_query } from '$/server/shows/shows_queries';

export const load = async function ({ params }) {
	const show_card_query = get_show_card_query();
	return {
		guest: await prisma_client.guest.findUnique({
			where: {
				name_slug: params.name_slug
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
		})
	};
};
