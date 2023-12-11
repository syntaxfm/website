import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
	return {
		meta: {
			title: 'Ask a Potluck Question'
		}
	};
};
