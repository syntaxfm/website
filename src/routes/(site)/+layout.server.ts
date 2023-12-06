export const load = async ({ locals }) => {
	return {
		user: locals.user,
		user_theme: locals.theme
	};
};
