import social_banner from '$assets/syntax-banner.png';

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		user_theme: locals.theme,
		meta: {
			description: `Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development, CSS, JavaScript, Frameworks, Typescript, Servers and more. Listen in 3 times a week!`,
			image: social_banner,
			title: `Syntax - A Tasty Treats Podcast for Web Developers.`
		}
	};
};
