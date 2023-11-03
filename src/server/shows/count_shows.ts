import { prisma_client } from '../../hooks.server';

export function count_shows() {
	const today = new Date();
	return prisma_client.show.count({
		where: {
			date: {
				lte: today
			}
		}
	});
}
