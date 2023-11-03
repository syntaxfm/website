import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals }) {
	const count = await locals.prisma.show.count();
	return { count };
};
