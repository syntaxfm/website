// The normalized result of one SEO snapshot, stored as JSON in `seo_snapshots.report`.
// Raw API responses are not kept: only the fields the dashboard and comparisons use.

export type PositionBands = {
	pos_1: number;
	pos_2_3: number;
	pos_4_10: number;
	pos_11_20: number;
	pos_21_100: number;
};

export type DomainOverview = {
	keyword_count: number;
	// DataForSEO's estimate of monthly visits from organic search
	estimated_traffic: number;
	bands: PositionBands;
	new_count: number;
	up_count: number;
	down_count: number;
	lost_count: number;
};

export type RankedKeyword = {
	keyword: string;
	search_volume: number | null;
	// Organic position on Google (rank_group: ads and boxes don't count)
	position: number;
	url: string;
	keyword_difficulty: number | null;
	intent: string | null;
	has_ai_overview: boolean;
};

export type Competitor = {
	domain: string;
	shared_keywords: number;
	average_position: number;
	estimated_traffic: number;
};

export type Backlinks = {
	rank: number;
	backlinks: number;
	referring_domains: number;
	broken_backlinks: number;
};

// One organic Google result for a tracked search, as the snapshot saw it
export type GoogleResult = {
	// Organic position (rank_group: ads and boxes don't count)
	position: number | null;
	title: string | null;
	// Null when Google links through google.com/goto, which hides the page
	url: string | null;
	domain: string | null;
	description: string | null;
	// A syntax.fm page or one of Syntax's YouTube videos. The first five snapshots only flag
	// syntax.fm.
	is_syntax: boolean;
};

// A Syntax video in Google's video box, which sits among the results but has no organic position
export type GoogleVideoBoxResult = {
	// 1 for the box's first video
	position: number;
	title: string | null;
	url: string | null;
};

export type GoogleSearchCheck = {
	search: string;
	// Syntax's best organic position: a syntax.fm page or one of Syntax's YouTube videos, from the
	// live check of Google's first page, or else syntax.fm's from the ranked keywords (Google's top
	// 100). The first five snapshots (2026-11-16 to 2026-11-18) checked 20 results live, which gave
	// a different, wrong list, and only counted syntax.fm.
	syntax_position: number | null;
	syntax_title: string | null;
	// Snapshots before 2026-11-17 don't have it
	syntax_url?: string | null;
	// Where the result is: "syntax.fm" or "YouTube · Syntax". The first five snapshots don't have it
	syntax_site?: string | null;
	// The first five snapshots don't have it
	syntax_video_box?: GoogleVideoBoxResult | null;
	// Google's result types on the page, such as ai_overview, video, people_also_ask
	result_types: string[];
	top_sites: string[];
	// The first SEARCH_RESULT_DETAIL_LENGTH organic results. Snapshots before 2026-11-18 don't have it
	top_results?: GoogleResult[];
};

export type YoutubeChannel = { id: string; name: string };

// One YouTube result for a tracked search, as the snapshot saw it
export type YoutubeResult = {
	position: number;
	title: string | null;
	url: string | null;
	video_id: string | null;
	channel_name: string | null;
	channel_handle: string | null;
	// From "14,344 views"; null when YouTube's text has no number
	view_count: number | null;
	length_text: string | null;
	published_text: string | null;
	description_snippet: string | null;
	is_syntax: boolean;
};

export type YoutubeSearchCheck = {
	search: string;
	// In YouTube's first two pages (about 40 results). The first five snapshots only have the first.
	syntax_position: number | null;
	syntax_video_title: string | null;
	syntax_video_url: string | null;
	top_channels: string[];
	// The first SEARCH_RESULT_DETAIL_LENGTH results. Snapshots before 2026-11-18 don't have it
	top_results?: YoutubeResult[];
};

// One show in Spotify's search results, as the snapshot saw it
export type SpotifyShowResult = {
	position: number;
	name: string;
	url: string;
	publisher: string | null;
	is_syntax: boolean;
};

// One episode in Spotify's search results, as the snapshot saw it
export type SpotifyEpisodeResult = {
	position: number;
	title: string;
	url: string;
	show_name: string | null;
	show_url: string | null;
	// As Spotify shows it: "Oct 28", "Wednesday", "Dec 30, 2024"
	published_text: string | null;
	// "58 min 6 sec"
	length_text: string | null;
	description_snippet: string | null;
	is_syntax: boolean;
};

// A tracked search on Spotify's search page, logged out. Snapshots before 2026-11-20 don't have it.
export type SpotifySearchCheck = {
	search: string;
	// Syntax's show among the top 10 shows
	syntax_show_position: number | null;
	// Syntax's best episode among the top 30 episodes
	syntax_episode_position: number | null;
	syntax_episode_title: string | null;
	syntax_episode_url: string | null;
	top_shows: string[];
	// Every show on the page. Left out of summaries, like top_results
	show_results?: SpotifyShowResult[];
	// The first SEARCH_RESULT_DETAIL_LENGTH episodes
	top_results?: SpotifyEpisodeResult[];
};

export type YoutubeSearchTerm = {
	term: string;
	views: number;
	// Null where YouTube's report doesn't give it (a video's own terms)
	minutes_watched: number | null;
};

export type YoutubeVideoSearchTerms = {
	video_id: string;
	// From the site's episodes and videos; null for a video the site doesn't have
	title: string | null;
	// Views that came from YouTube search
	search_views: number;
	terms: YoutubeSearchTerm[];
};

// What people typed into YouTube search before watching a Syntax video, from YouTube Analytics
export type YoutubeSearchTerms = {
	// YYYY-MM-DD, 28 days ending the day before the snapshot
	start_date: string;
	end_date: string;
	total_views: number;
	search_views: number;
	// The channel's top 25 terms, most views first
	terms: YoutubeSearchTerm[];
	// The 10 videos search found most, each with its top terms
	videos: YoutubeVideoSearchTerms[];
};

// How much a tracked search is searched for, and how hard it is to reach Google's top 10
export type SearchDemand = {
	search: string;
	// US Google searches a month, averaged over the last year
	search_volume: number | null;
	// 0 to 100
	keyword_difficulty: number | null;
	// Searches in each of the last 12 months, oldest first
	monthly: number[];
};

export type SeoReport = {
	version: 1;
	settings: { domain: string; location_code: number; language_code: string };
	overview: DomainOverview | null;
	keywords: RankedKeyword[];
	competitors: Competitor[];
	backlinks: Backlinks | null;
	google_searches: GoogleSearchCheck[];
	youtube_searches: YoutubeSearchCheck[];
	// Snapshots before 2026-11-20 don't have it
	spotify_searches?: SpotifySearchCheck[];
	// Snapshots before 2026-11-17 don't have it
	demand?: SearchDemand[];
	// Null when YouTube Analytics failed (see the snapshot's errors). Snapshots before 2026-11-19
	// don't have it.
	youtube_search_terms?: YoutubeSearchTerms | null;
};

export type SeoCallError = {
	capability: string;
	// The search or domain the call was about
	subject: string;
	code: string;
	message: string;
};
