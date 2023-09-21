import { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		show: locals.prisma.show.findFirst({ orderBy: { number: 'desc' } })
	};
};
