import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }) {
	const { number } = params;
	const show = await locals.prisma.show.findFirst({ where: { number: parseInt(number) } });
	throw redirect(302, `/shows/${number}/${show.slug}`);
};
