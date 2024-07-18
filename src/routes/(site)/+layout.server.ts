import { cache } from '$/server/cache/cache';
export const load = async ({ locals }) => {
	const cache_s = 600;
	// TODO add s override

	return {
		// We load latest in layout to get the most recent track in player data
		// auto gets passed into that page
		latest: await cache.shows.latest_shows(),
		user: locals.user,
		user_theme: locals.theme
	};
};
