import { SHOW_QUERY } from '$server/ai/queries.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	const show_number = parseInt(params.number);
	console.log({ show_number });
	const query = SHOW_QUERY();
	return {
		show: locals.prisma.show.findFirst({
			...query,
			where: {
				number: parseInt(params.number)
			}
		})
	};
};
