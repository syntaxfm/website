export const load = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					image: locals.user.image,
					roles: locals.user.roles
				}
			: null,
		user_theme: locals.theme
	};
};
