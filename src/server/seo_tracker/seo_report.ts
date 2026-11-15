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

export type GoogleSearchCheck = {
	search: string;
	syntax_position: number | null;
	syntax_title: string | null;
	// Google's result types on the page, such as ai_overview, video, people_also_ask
	result_types: string[];
	top_sites: string[];
};

export type YoutubeChannel = { id: string; name: string };

export type YoutubeSearchCheck = {
	search: string;
	syntax_position: number | null;
	syntax_video_title: string | null;
	syntax_video_url: string | null;
	top_channels: string[];
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
};

export type SeoCallError = {
	capability: string;
	// The search or domain the call was about
	subject: string;
	code: string;
	message: string;
};
