import { cache } from '$/server/cache/cache';
export const load = async ({ locals }) => {
	const cache_s = 600;

	// TODO allow for s override
	const latest = cache.shows.latest_shows();

	return {
		latest,
		user: locals.user,
		user_theme: locals.theme
	};
};
