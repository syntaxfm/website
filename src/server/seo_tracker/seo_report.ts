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
	// Snapshots before 2026-11-17 don't have it
	demand?: SearchDemand[];
};

export type SeoCallError = {
	capability: string;
	// The search or domain the call was about
	subject: string;
	code: string;
	message: string;
};
