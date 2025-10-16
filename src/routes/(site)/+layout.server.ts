export const load = async ({ locals }) => {
	return {
		// We load latest in layout to get the most recent track in player data
		// auto gets passed into that page
		user: locals.user,
		user_theme: locals.theme
	};
};
