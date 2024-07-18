import { cache } from '$/server/cache/cache';

export const load = async function () {
	return {
		count: await cache.shows.count_shows(),
		meta: {
			title: 'About Syntax'
		}
	};
};
