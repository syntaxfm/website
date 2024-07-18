import type { Actions } from '@sveltejs/kit';
import { redis } from '../../hooks.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
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
