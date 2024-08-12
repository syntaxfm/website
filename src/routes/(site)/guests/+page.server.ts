import { prisma_client } from '$/hooks.server';

export const load = async function () {
	const guests = await prisma_client.guest.findMany({
		include: {
			shows: {
				select: {
					Show: {
						include: {
							guests: {
								select: {
									Guest: {
										select: {
											name: true,
											of: true,
											name_slug: true,
											id: true,
											github: true,
											url: true,
											social: true
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
	// Sort the guests by their most recent show number
	const sorted_guests = guests.sort((a, b) => {
		const a_show = a.shows.sort((a, b) => b.Show.number - a.Show.number);
		const b_show = b.shows.sort((a, b) => b.Show.number - a.Show.number);
		return b_show[0].Show.number - a_show[0].Show.number;
	});
	return { guests };
};
