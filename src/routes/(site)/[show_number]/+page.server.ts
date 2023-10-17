import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const { show_number } = params;
	const show = await locals.prisma.show.findFirst({ where: { number: parseInt(show_number) } });
	if (show) throw redirect(302, `/shows/${show_number}/${show.slug}`);
	throw redirect(302, `/shows`);
};
