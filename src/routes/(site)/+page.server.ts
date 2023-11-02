import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SHOW_QUERY } from '$server/ai/queries';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const cache_ms = 600;

	setHeaders({
		'cache-control': `public s-max-age=${cache_ms}, stale-while-revalidate=${cache_ms}`
	});

	return {
		latest: locals.prisma.show.findMany(SHOW_QUERY())
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
	}
};
