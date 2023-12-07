import { Prisma } from '@prisma/client';

export const shows_api_query = (): Prisma.ShowFindManyArgs => ({
	orderBy: { number: 'desc' },
	include: {
		guests: {
			select: {
				Guest: {
					select: {
						github: true,
						name: true
					}
				}
			}
		}
	},
	where: {
		date: {
			lte: new Date()
		}
	}
});
