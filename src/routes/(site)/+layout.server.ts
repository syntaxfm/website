import social_banner from '$assets/syntax-banner.png';

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		user_theme: locals.theme,
		meta: {
			title: `Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences.`,
			image: social_banner,
			description: `Syntax - A Tasty Treats Podcast for Web Developers.`
		}
	};
};
