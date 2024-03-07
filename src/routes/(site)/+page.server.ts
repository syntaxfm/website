import { SHOW_QUERY, type LatestShow } from '$server/ai/queries';
import { cache_mang } from '$utilities/cache_mang';
import type { Actions } from '@sveltejs/kit';
import { redis } from '../../hooks.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const cache_s = 600;

	const latest: LatestShow[] = await cache_mang(
		`homepage:latest_shows`,
		locals.prisma.show.findMany,
		SHOW_QUERY(),
		cache_s
	);

	return {
		latest,
		meta: {
			// canonical tells google to use `syntax.fm`, and not syntax.fm?ref=someBlog
			canonical: `${url.protocol}//${url.host}`
		}
	};
};

export const actions: Actions = {
	logout: async function logout({ locals, cookies }) {
		await locals.prisma.session.delete({
			where: {
				access_token: cookies.get('access_token')
			}
		});
		// Remove Auth Token Cookie
		cookies.delete('access_token', {
			httpOnly: true,
			path: '/',
			secure: true
		});
		return {
			message: 'Logout Successful'
		};
	},
	dump_cache: async function dump_cache() {
		await redis?.flushall();
		return {
			message: 'Dump Cache '
		};
	}
};
