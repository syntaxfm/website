import {
	find_opportunities,
	is_on_topic,
	niche_visibility,
	OPPORTUNITY_POSITIONS,
	MIN_OPPORTUNITY_SEARCH_VOLUME,
	search_moves,
	spotify_positions,
	type SearchMove
} from './seo_compare';
import type {
	Backlinks,
	Competitor,
	DomainOverview,
	GoogleSearchCheck,
	PositionBands,
	RankedKeyword,
	SearchDemand,
	SeoReport,
	SpotifySearchCheck,
	YoutubeSearchCheck
} from './seo_report';

// Small, focused views of SEO snapshots for the SEO MCP tools (seo_queries.ts), so an agent loads
// only what one question needs. Pure: the queries read the rows, these shape them.

/** The parts of a snapshot the overview and search list read: no keyword list, no result detail. */
export interface SnapshotSummary {
	taken_at: Date;
	overview: DomainOverview | null;
	backlinks: Backlinks | null;
	competitors: Competitor[];
	google_searches: GoogleSearchCheck[];
	youtube_searches: YoutubeSearchCheck[];
	// Empty for snapshots before Spotify was tracked
	spotify_searches: SpotifySearchCheck[];
	demand: SearchDemand[] | null;
}

/** A report without each tracked search's result detail, as the SEO page has always read it. */
export function without_result_detail(report: SeoReport): SeoReport {
	return {
		...report,
		google_searches: report.google_searches.map(({ top_results: _detail, ...check }) => check),
		youtube_searches: report.youtube_searches.map(({ top_results: _detail, ...check }) => check),
		...(report.spotify_searches
			? {
					spotify_searches: report.spotify_searches.map(
						({ top_results: _detail, show_results: _shows, ...check }) => check
					)
				}
			: {})
	};
}

function moves_by_search(moves: readonly SearchMove[]): Map<string, SearchMove> {
	return new Map(moves.map((move) => [move.search, move]));
}

function difference(current: number | null | undefined, previous: number | null | undefined) {
	return current === null || current === undefined || previous === null || previous === undefined
		? null
		: current - previous;
}

function visibility_of(summary: SnapshotSummary) {
	return niche_visibility({ ...summary, demand: summary.demand ?? undefined });
}

/** The latest snapshot's totals, position bands, backlinks and competitors, and their change. */
export function build_seo_overview(latest: SnapshotSummary, previous: SnapshotSummary | null) {
	const bands = latest.overview?.bands;
	const previous_bands = previous?.overview?.bands;
	const band_names: (keyof PositionBands)[] = [
		'pos_1',
		'pos_2_3',
		'pos_4_10',
		'pos_11_20',
		'pos_21_100'
	];

	return {
		taken_at: latest.taken_at,
		previous_taken_at: previous?.taken_at ?? null,
		overview: latest.overview,
		// Share of the tracked searches' monthly volume where Syntax shows up, 0 to 1
		niche_visibility: visibility_of(latest),
		backlinks: latest.backlinks,
		competitors: latest.competitors,
		tracked_search_count: latest.google_searches.length,
		change_since_previous: previous
			? {
					keyword_count: difference(
						latest.overview?.keyword_count,
						previous.overview?.keyword_count
					),
					estimated_traffic: difference(
						latest.overview?.estimated_traffic,
						previous.overview?.estimated_traffic
					),
					bands:
						bands && previous_bands
							? Object.fromEntries(
									band_names.map((band) => [band, bands[band] - previous_bands[band]])
								)
							: null,
					niche_visibility: difference(visibility_of(latest), visibility_of(previous)),
					referring_domains: difference(
						latest.backlinks?.referring_domains,
						previous.backlinks?.referring_domains
					),
					backlink_rank: difference(latest.backlinks?.rank, previous.backlinks?.rank)
				}
			: null
	};
}

// Positive when Syntax moved up (a smaller position number); null when either side is missing
function position_change(move: SearchMove | undefined) {
	return move?.from !== null && move?.from !== undefined && move.to !== null
		? move.from - move.to
		: null;
}

/** Every tracked search in one compact row: Syntax's positions, their change, and demand. */
export function build_seo_search_rows(latest: SnapshotSummary, previous: SnapshotSummary | null) {
	const google_moves = moves_by_search(
		search_moves(previous?.google_searches ?? [], latest.google_searches)
	);
	const youtube_moves = moves_by_search(
		search_moves(previous?.youtube_searches ?? [], latest.youtube_searches)
	);
	const spotify_moves = (list: 'show' | 'episode') =>
		moves_by_search(
			search_moves(
				spotify_positions(previous?.spotify_searches ?? [], list),
				spotify_positions(latest.spotify_searches, list)
			)
		);
	const spotify_show_moves = spotify_moves('show');
	const spotify_episode_moves = spotify_moves('episode');
	const youtube = new Map(latest.youtube_searches.map((check) => [check.search, check]));
	const spotify = new Map(latest.spotify_searches.map((check) => [check.search, check]));
	const demand = new Map((latest.demand ?? []).map((row) => [row.search, row]));
	const searches = [
		...new Set([
			...latest.google_searches.map((check) => check.search),
			...latest.youtube_searches.map((check) => check.search),
			...latest.spotify_searches.map((check) => check.search)
		])
	];
	const google = new Map(latest.google_searches.map((check) => [check.search, check]));

	return searches.map((search) => {
		const google_move = google_moves.get(search);
		const youtube_move = youtube_moves.get(search);
		const spotify_show_move = spotify_show_moves.get(search);
		const spotify_episode_move = spotify_episode_moves.get(search);
		return {
			search,
			google_position: google.get(search)?.syntax_position ?? null,
			google_previous_position: google_move?.from ?? null,
			google_change: position_change(google_move),
			youtube_position: youtube.get(search)?.syntax_position ?? null,
			youtube_previous_position: youtube_move?.from ?? null,
			youtube_change: position_change(youtube_move),
			spotify_show_position: spotify.get(search)?.syntax_show_position ?? null,
			spotify_show_previous_position: spotify_show_move?.from ?? null,
			spotify_show_change: position_change(spotify_show_move),
			spotify_episode_position: spotify.get(search)?.syntax_episode_position ?? null,
			spotify_episode_previous_position: spotify_episode_move?.from ?? null,
			spotify_episode_change: position_change(spotify_episode_move),
			search_volume: demand.get(search)?.search_volume ?? null,
			keyword_difficulty: demand.get(search)?.keyword_difficulty ?? null,
			google_url: google.get(search)?.syntax_url ?? null,
			youtube_url: youtube.get(search)?.syntax_video_url ?? null,
			spotify_episode_url: spotify.get(search)?.syntax_episode_url ?? null
		};
	});
}

export type SeoPlatform = 'google' | 'youtube' | 'spotify' | 'all';

/** One snapshot's checks of one tracked search, newest snapshot first. */
export interface SearchHistoryRow {
	taken_at: Date;
	google: GoogleSearchCheck | null;
	youtube: YoutubeSearchCheck | null;
	spotify: SpotifySearchCheck | null;
}

/**
 * One tracked search in depth: Syntax's position over time, and the latest results with what
 * outranks Syntax. Snapshots before 2026-11-18 kept only the top 3 names, so then
 * results_detail_available is false and top_sites or top_channels stand in.
 */
export function build_seo_search_detail(
	history: SearchHistoryRow[],
	demand: SearchDemand | null,
	platform: SeoPlatform
) {
	const [latest] = history;
	const google = latest?.google;
	const youtube = latest?.youtube;
	const spotify = latest?.spotify;
	const position_history = (read: (row: SearchHistoryRow) => number | null | undefined) =>
		history.map((row) => ({ taken_at: row.taken_at, position: read(row) ?? null }));
	const includes = (wanted: SeoPlatform) => platform === 'all' || platform === wanted;

	return {
		search: google?.search ?? youtube?.search ?? spotify?.search ?? null,
		taken_at: latest?.taken_at ?? null,
		demand: demand
			? {
					search_volume: demand.search_volume,
					keyword_difficulty: demand.keyword_difficulty,
					monthly_searches_oldest_first: demand.monthly
				}
			: null,
		...(includes('google') && google
			? {
					google: {
						syntax_position: google.syntax_position,
						syntax_title: google.syntax_title,
						syntax_url: google.syntax_url ?? null,
						result_types: google.result_types,
						results_detail_available: google.top_results !== undefined,
						top_sites: google.top_sites,
						top_results: google.top_results ?? null,
						position_history: position_history((row) => row.google?.syntax_position)
					}
				}
			: {}),
		...(includes('youtube') && youtube
			? {
					youtube: {
						syntax_position: youtube.syntax_position,
						syntax_video_title: youtube.syntax_video_title,
						syntax_video_url: youtube.syntax_video_url,
						results_detail_available: youtube.top_results !== undefined,
						top_channels: youtube.top_channels,
						top_results: youtube.top_results ?? null,
						position_history: position_history((row) => row.youtube?.syntax_position)
					}
				}
			: {}),
		...(includes('spotify') && spotify
			? {
					spotify: {
						syntax_show_position: spotify.syntax_show_position,
						syntax_episode_position: spotify.syntax_episode_position,
						syntax_episode_title: spotify.syntax_episode_title,
						syntax_episode_url: spotify.syntax_episode_url,
						show_results: spotify.show_results ?? null,
						top_episodes: spotify.top_results ?? null,
						show_position_history: position_history((row) => row.spotify?.syntax_show_position),
						episode_position_history: position_history(
							(row) => row.spotify?.syntax_episode_position
						)
					}
				}
			: {})
	};
}

export type KeywordSort = 'volume' | 'position' | 'difficulty';

export interface KeywordFilters {
	query?: string;
	min_volume?: number;
	position_min?: number;
	position_max?: number;
	on_topic_only: boolean;
	sort: KeywordSort;
	limit: number;
	offset: number;
}

const by_volume = (a: RankedKeyword, b: RankedKeyword) =>
	(b.search_volume ?? -1) - (a.search_volume ?? -1);

const KEYWORD_ORDER: Record<KeywordSort, (a: RankedKeyword, b: RankedKeyword) => number> = {
	volume: by_volume,
	// Best position first
	position: (a, b) => a.position - b.position || by_volume(a, b),
	// Easiest first; unknown difficulty last
	difficulty: (a, b) =>
		(a.keyword_difficulty ?? Infinity) - (b.keyword_difficulty ?? Infinity) || by_volume(a, b)
};

/** One page of the Google keywords Syntax ranks for, filtered and sorted. */
export function filter_seo_keywords(
	keywords: readonly RankedKeyword[],
	topic_names: readonly string[],
	filters: KeywordFilters
) {
	const query = filters.query?.trim().toLowerCase() ?? '';
	const matches = keywords
		.filter(
			(keyword) =>
				(query === '' || keyword.keyword.toLowerCase().includes(query)) &&
				(filters.min_volume === undefined || (keyword.search_volume ?? 0) >= filters.min_volume) &&
				(filters.position_min === undefined || keyword.position >= filters.position_min) &&
				(filters.position_max === undefined || keyword.position <= filters.position_max) &&
				(!filters.on_topic_only || is_on_topic(keyword.keyword, topic_names))
		)
		.sort(KEYWORD_ORDER[filters.sort]);

	return {
		total_matches: matches.length,
		offset: filters.offset,
		limit: filters.limit,
		items: matches.slice(filters.offset, filters.offset + filters.limit)
	};
}

/** Striking-distance keywords (find_opportunities), at most limit of them. */
export function build_seo_opportunities(
	keywords: readonly RankedKeyword[],
	topic_names: readonly string[],
	limit: number
) {
	const { on_topic, off_topic_count } = find_opportunities(keywords, topic_names);
	return {
		positions: OPPORTUNITY_POSITIONS,
		min_search_volume: MIN_OPPORTUNITY_SEARCH_VOLUME,
		on_topic_count: on_topic.length,
		off_topic_count,
		items: on_topic.slice(0, limit)
	};
}
