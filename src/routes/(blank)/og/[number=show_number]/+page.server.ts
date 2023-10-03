import { SHOW_QUERY } from '$server/ai/queries.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ setHeaders, url, locals }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const query = SHOW_QUERY();
	return {
		show: locals.prisma.show.findFirst(query)
	};
};
