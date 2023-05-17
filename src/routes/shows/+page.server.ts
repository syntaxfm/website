import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		shows: locals.prisma.show.findMany({ orderBy: { number: 'desc' } })
	};
};
