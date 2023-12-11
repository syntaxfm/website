import { count_shows } from '$server/shows/count_shows';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	return {
		count: count_shows(),
		meta: {
			title: 'About Syntax'
		}
	};
};
