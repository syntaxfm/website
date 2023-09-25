export const load = async ({ locals }) => {
	return {
		user: locals.user,
		user_theme: locals.theme,
		meta_description: '',
		meta_image: '',
		meta_title: ''
	};
};
