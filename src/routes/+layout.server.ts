import { SHOW_QUERY, type LatestShow } from '$/server/ai/queries';
import { cache_mang } from '$/utilities/cache_mang';

export const load = async ({ locals }) => {
	const cache_s = 600;

	const latest: LatestShow[] = await cache_mang(
		`homepage:latest_shows`,
		locals.prisma.show.findMany,
		SHOW_QUERY(),
		cache_s
	);

	return {
		latest,
		user: locals.user,
		user_theme: locals.theme
	};
};
