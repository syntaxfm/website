import { cache } from '$/server/cache/cache';

export const load = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		show: await cache.shows.show(100)
	};
};
