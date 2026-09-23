// * Constant variables
// Things that won't be reassigned, although maybe more org needed here eventually

export const DAYS_OF_WEEK_TYPES: { [key: number]: 'HASTY' | 'TASTY' | 'SUPPER' | 'SPECIAL' } = {
	1: 'HASTY', // Monday
	3: 'TASTY', // Wednesday
	5: 'SUPPER' // Friday
};

export const CURRENT_YEAR = new Date().getFullYear();

export const PODCAST_LINKS = [
	{
		href: 'https://feed.syntax.fm',
		text: 'RSS'
	},
	{
		href: 'https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby?si=bOe7-kl6RnOHapMsVnFWgw',
		text: 'Spotify'
	},
	{
		href: 'https://itunes.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678?mt=2',
		text: 'Apple Podcasts'
	},
	{
		href: 'https://www.youtube.com/@syntaxfm',
		text: 'YouTube'
	},
	{
		href: 'https://overcast.fm/itunes1253186678/syntax-tasty-web-development-treats',
		text: 'Overcast'
	},
	{
		href: 'https://pca.st/fmx9',
		text: 'PocketCasts'
	},
	{
		href: 'https://music.amazon.com/podcasts/3f16a46b-6281-4fc7-99de-380fbeb6d970/syntax---tasty-web-development-treats',
		text: 'Amazon Music'
	}
];

// AI & Transcripts
export const PER_PAGE = 10;

// Youtube
export const YOUTUBE_CHANNEL_ID = 'UCyU5wkjgQYGRB0hIHMwm2Sg';
