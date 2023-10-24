import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		show: locals.prisma.show.findFirst({
			where: {
				date: {
					lte: new Date()
				}
			},
			orderBy: { number: 'desc' }
		})
	};
};
