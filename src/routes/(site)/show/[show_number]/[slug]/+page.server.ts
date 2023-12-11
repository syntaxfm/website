import { get_show_cache_s } from '$utilities/get_show_cache_ms';

export const load = async function ({ setHeaders, parent }) {
	const { show } = await parent();
	const cache_ms = get_show_cache_s(show.date);
	setHeaders({
		'cache-control': `public s-max-age=${cache_ms}, stale-while-revalidate=${cache_ms}`
	});
	return {};
};
