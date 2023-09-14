// * Constant variables
// Things that won't be reassigned, although maybe more org needed here eventually

export const GITHUB_USER_URL = 'https://api.github.com/user';
export const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

export const CURRENT_YEAR = new Date().getFullYear();

export const PODCAST_LINKS = [
	{
		href: 'https://feed.syntax.fm/rss',
		text: 'RSS'
	},
	{
		href: 'https://itunes.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678?mt=2',
		text: 'iTunes'
	},
	{
		href: 'https://overcast.fm/itunes1253186678/syntax-tasty-web-development-treats',
		text: 'Overcast'
	},
	{
		href: 'https://www.google.com/podcasts?feed=aHR0cHM6Ly9mZWVkLnN5bnRheC5mbS9yc3M%3D',
		text: 'Google Podcasts'
	},
	{
		href: 'https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby?si=bOe7-kl6RnOHapMsVnFWgw',
		text: 'Spotify'
	},
	{
		href: 'https://pca.st/fmx9',
		text: 'PocketCasts'
	}
];

export interface GithubUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string | null;
	company: string | null;
	blog: string;
	location: string | null;
	email: string | null;
	hireable: boolean | null;
	bio: string | null;
	twitter_username: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
}
