export const load = async ({ locals, cookies }) => {
	console.log(decodeURIComponent(cookies.get('theme') || 'system'));
	return {
		user: locals.user,
		user_theme: locals.theme
	};
};
