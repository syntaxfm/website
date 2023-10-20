import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	const count = await locals.prisma.show.count();
  return { count }
};
