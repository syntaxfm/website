import { prisma_client } from '$/server/prisma-client';

export const load = async () => {
	const next_shows = await prisma_client.show.findMany({
		where: {
			date: {
				gt: new Date()
			}
		},
		include: {
			aiShowNote: {
				include: {
					topics: true
				}
			}
		},
		orderBy: {
			date: 'asc'
		},
		take: 9
	});
	const last_9_shows = await prisma_client.show.findMany({
		where: {
			date: {
				lt: new Date()
			}
		},
		include: {
			aiShowNote: {
				include: {
					topics: true
				}
			}
		},
		orderBy: {
			date: 'desc'
		},
		take: 9
	});
	return {
		next_shows,
		last_9_shows
	};
};
