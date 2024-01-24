import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		show: await locals.prisma.show.findFirst({
			where: {
				date: {
					lte: new Date()
				}
			},
			include: {
				guests: {
					select: {
						Guest: true
					}
				},
				aiShowNote: {
					include: {
						topics: true,
						links: true,
						summary: true,
						tweets: true
					}
				}
			},

			orderBy: { number: 'desc' }
		})
	};
};
