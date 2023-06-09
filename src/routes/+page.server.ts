import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		latest: locals.prisma.show.findMany({ take: 11, orderBy: { number: 'desc' } })
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

	set_theme: async function set_theme({ locals }) {
		locals.prisma.user.update({
			data: {
				active_theme_name: locals.form_data.theme_name
			}
		});
	}
};
