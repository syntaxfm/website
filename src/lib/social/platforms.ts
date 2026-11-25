import { PODCAST_LINKS } from '$const';

export type Platform = {
	label: string;
	action: string;
	href: string;
	icon?:
		| 'youtube'
		| 'spotify'
		| 'apple-podcasts'
		| 'twitter'
		| 'github'
		| 'discord'
		| 'instagram'
		| 'tiktok'
		| 'linkedin'
		| 'threads';
	image?: string;
	bg: string;
	fg?: string;
};

/** Looks up the URL by its `PODCAST_LINKS` text so podcast URLs stay single-sourced in const.ts. */
function podcast_href(text: string): string {
	const link = PODCAST_LINKS.find((podcast_link) => podcast_link.text === text);
	if (!link) throw new Error(`No PODCAST_LINKS entry named "${text}"`);
	return link.href;
}

const OVERCAST: Platform = {
	label: 'Overcast',
	action: 'Subscribe',
	href: podcast_href('Overcast'),
	image: '/icons/overcast.jpg',
	bg: '#fc7e0f'
};

const YOUTUBE: Platform = {
	label: 'YouTube',
	action: 'Subscribe',
	href: podcast_href('YouTube'),
	icon: 'youtube',
	bg: '#f61c0d',
	fg: '#fff'
};

const SPOTIFY: Platform = {
	label: 'Spotify',
	action: 'Follow us',
	href: podcast_href('Spotify'),
	icon: 'spotify',
	bg: '#1db954',
	fg: '#000'
};

const APPLE: Platform = {
	label: 'Apple',
	action: 'Subscribe',
	href: podcast_href('Apple Podcasts'),
	icon: 'apple-podcasts',
	bg: '#a93dd1',
	fg: '#fff'
};

/** The four shown at the bottom of every page. */
export const FEATURED_PODCAST_PLATFORMS: Platform[] = [OVERCAST, YOUTUBE, SPOTIFY, APPLE];

export const PODCAST_PLATFORMS: Platform[] = [
	...FEATURED_PODCAST_PLATFORMS,
	{
		label: 'Pocket Casts',
		action: 'Subscribe',
		href: podcast_href('PocketCasts'),
		image: '/icons/pocketcasts.jpg',
		bg: '#f43e37'
	},
	{
		label: 'Amazon Music',
		action: 'Follow us',
		href: podcast_href('Amazon Music'),
		image: '/icons/amznMusic.png',
		bg: '#25d1da'
	},
	{
		label: 'RSS',
		action: 'Any podcast app',
		href: podcast_href('RSS'),
		image: '/icons/rss.svg',
		bg: '#ffa500'
	}
];

export const SOCIAL_PLATFORMS: Platform[] = [
	{ label: 'X', action: 'Follow', href: 'https://x.com/syntaxfm', icon: 'twitter', bg: '#000' },
	{
		label: 'GitHub',
		action: 'Follow',
		href: 'https://github.com/syntaxfm',
		icon: 'github',
		bg: '#24292f'
	},
	{
		label: 'Discord',
		action: 'Join us',
		href: 'https://discord.gg/W5y68HMfZV',
		icon: 'discord',
		bg: '#5865f2'
	},
	{
		label: 'Instagram',
		action: 'Follow',
		href: 'https://www.instagram.com/syntax_fm/',
		icon: 'instagram',
		bg: '#e1306c'
	},
	{
		label: 'TikTok',
		action: 'Follow',
		href: 'https://www.tiktok.com/@syntaxfm',
		icon: 'tiktok',
		bg: '#000'
	},
	{
		label: 'LinkedIn',
		action: 'Follow',
		href: 'https://www.linkedin.com/company/syntaxfm/',
		icon: 'linkedin',
		bg: '#0a66c2'
	},
	{
		label: 'Threads',
		action: 'Follow',
		href: 'https://www.threads.net/@syntax_fm',
		icon: 'threads',
		bg: '#000'
	}
];
