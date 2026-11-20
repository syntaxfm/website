import { as_array, as_number, as_string, read_path } from '#lib/utils/narrow.ts';
import type { YoutubeSearchTerm, YoutubeSearchTerms, YoutubeVideoSearchTerms } from './seo_report';

// What people typed into YouTube search before watching a Syntax video, from YouTube Analytics
// (first-party, free). It acts as the channel's owner or a manager, so YouTube must be connected in admin with
// analytics access (src/server/video/youtube_owner.ts). YouTube only gives the top 25 terms per
// report, so the channel's top terms come with each top video's own.

const REPORTS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports';
const SEARCH_SOURCE = 'YT_SEARCH';
// YouTube's most terms per report
const TERMS_PER_REPORT = 25;
// The most-watched videos checked for how many views came from search
const VIDEO_POOL = 25;
// Of those, the ones search found most get their own terms
const TOP_VIDEO_COUNT = 10;
const TERMS_PER_VIDEO = 10;
// The window ends yesterday, since YouTube's numbers for today are still filling in
export const SEARCH_TERM_DAYS = 28;
// Google's servers sometimes answer a report with 500 "Internal error encountered." or 503 for a
// moment, and its docs say to ask again after a wait. One snapshot asks for about 38 reports.
const REPORT_ATTEMPTS = 3;
export const REPORT_RETRY_WAIT_MS = 1000;

export class YoutubeAnalyticsError extends Error {
	constructor(
		readonly code: string,
		message: string
	) {
		super(message);
		this.name = 'YoutubeAnalyticsError';
	}
}

/** The 28 days ending yesterday, as YouTube Analytics' YYYY-MM-DD dates. */
export function search_term_window(today: Date): { start_date: string; end_date: string } {
	const day_ms = 24 * 60 * 60 * 1000;
	const end = new Date(today.getTime() - day_ms);
	const start = new Date(end.getTime() - (SEARCH_TERM_DAYS - 1) * day_ms);
	return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
}

/** A report's rows as objects keyed by column name. */
export function read_report_rows(body: unknown): Record<string, string | number | null>[] {
	const columns = as_array(read_path(body, ['columnHeaders'])).map((column) =>
		as_string(read_path(column, ['name']))
	);
	if (columns.length === 0) throw new Error('YouTube Analytics returned no columns');
	return as_array(read_path(body, ['rows'])).map((row) =>
		Object.fromEntries(
			columns.map((name, index) => {
				const value = read_path(row, [index]);
				return [name ?? String(index), as_number(value) ?? as_string(value)];
			})
		)
	);
}

function read_terms(body: unknown): YoutubeSearchTerm[] {
	return read_report_rows(body).flatMap((row): YoutubeSearchTerm[] => {
		const term = row.insightTrafficSourceDetail;
		const views = row.views;
		if (typeof term !== 'string' || typeof views !== 'number') return [];
		const minutes = row.estimatedMinutesWatched;
		return [{ term, views, minutes_watched: typeof minutes === 'number' ? minutes : null }];
	});
}

/** All views and the views from YouTube search, from a views-by-traffic-source report. */
export function count_search_views(body: unknown): { total_views: number; search_views: number } {
	let total_views = 0;
	let search_views = 0;
	for (const row of read_report_rows(body)) {
		const views = typeof row.views === 'number' ? row.views : 0;
		total_views += views;
		if (row.insightTrafficSourceType === SEARCH_SOURCE) search_views += views;
	}
	return { total_views, search_views };
}

// Turns Google's refusal into what an admin has to do about it
export function read_analytics_error(status: number, body: unknown): YoutubeAnalyticsError {
	const message = as_string(read_path(body, ['error', 'message'])) ?? `HTTP ${status}`;
	const reasons = as_array(read_path(body, ['error', 'details'])).map((detail) =>
		as_string(read_path(detail, ['reason']))
	);
	if (reasons.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
		return new YoutubeAnalyticsError(
			'missing_analytics_access',
			'Reconnect YouTube on /admin/content/videos to add analytics access'
		);
	}
	if (reasons.includes('SERVICE_DISABLED')) {
		return new YoutubeAnalyticsError(
			'analytics_api_disabled',
			`Turn on the YouTube Analytics API in the Google Cloud project: ${message}`
		);
	}
	return new YoutubeAnalyticsError('youtube_analytics_failed', `${message} (HTTP ${status})`);
}

type ReportQuery = {
	dimensions: string;
	metrics: string;
	filters?: string;
	sort?: string;
	max_results?: number;
};

async function fetch_report(
	access_token: string,
	channel_id: string,
	window: { start_date: string; end_date: string },
	query: ReportQuery,
	fetch_fn: typeof fetch
): Promise<unknown> {
	const url = new URL(REPORTS_URL);
	url.search = new URLSearchParams({
		// Named, not channel==MINE: the connected account manages the Syntax channel without owning
		// it, and Google answers MINE with 403 Forbidden for a manager
		ids: `channel==${channel_id}`,
		startDate: window.start_date,
		endDate: window.end_date,
		dimensions: query.dimensions,
		metrics: query.metrics,
		...(query.filters ? { filters: query.filters } : {}),
		...(query.sort ? { sort: query.sort } : {}),
		...(query.max_results ? { maxResults: String(query.max_results) } : {})
	}).toString();
	for (let attempt = 1; ; attempt++) {
		const response = await fetch_fn(url, { headers: { authorization: `Bearer ${access_token}` } });
		if (response.ok) {
			const body: unknown = await response.json();
			return body;
		}
		// A server error can come back as an HTML page, not JSON
		const body: unknown = await response.json().catch(() => null);
		if (response.status < 500 || attempt === REPORT_ATTEMPTS) {
			throw read_analytics_error(response.status, body);
		}
		await new Promise((resolve) => setTimeout(resolve, attempt * REPORT_RETRY_WAIT_MS));
	}
}

/**
 * The channel's top YouTube search terms over the last 28 days, how many views came from search,
 * and the top terms for each of the videos search found most. `video_titles` names the videos.
 */
export async function fetch_youtube_search_terms(
	access_token: string,
	channel_id: string,
	video_titles: ReadonlyMap<string, string>,
	today: Date = new Date(),
	fetch_fn: typeof fetch = fetch
): Promise<YoutubeSearchTerms> {
	const window = search_term_window(today);
	const report = (query: ReportQuery) =>
		fetch_report(access_token, channel_id, window, query, fetch_fn);

	const [sources, channel_terms, most_watched] = await Promise.all([
		report({ dimensions: 'insightTrafficSourceType', metrics: 'views' }),
		report({
			dimensions: 'insightTrafficSourceDetail',
			metrics: 'views,estimatedMinutesWatched',
			filters: `insightTrafficSourceType==${SEARCH_SOURCE}`,
			sort: '-views',
			max_results: TERMS_PER_REPORT
		}),
		report({ dimensions: 'video', metrics: 'views', sort: '-views', max_results: VIDEO_POOL })
	]);

	const { total_views, search_views } = count_search_views(sources);

	// Google won't rank videos by search views directly, so each most-watched video's views are
	// split by source, and the ones search found most get their terms
	const pool = await Promise.all(
		read_report_rows(most_watched).flatMap((row) => {
			const video_id = row.video;
			if (typeof video_id !== 'string') return [];
			return [
				report({
					dimensions: 'insightTrafficSourceType',
					metrics: 'views',
					filters: `video==${video_id}`
				}).then((body) => ({ video_id, search_views: count_search_views(body).search_views }))
			];
		})
	);
	const found_by_search = pool
		.filter((video) => video.search_views > 0)
		.sort((a, b) => b.search_views - a.search_views)
		.slice(0, TOP_VIDEO_COUNT);

	const videos = await Promise.all(
		found_by_search.map(({ video_id, search_views: video_search_views }) =>
			report({
				dimensions: 'insightTrafficSourceDetail',
				metrics: 'views',
				filters: `video==${video_id};insightTrafficSourceType==${SEARCH_SOURCE}`,
				sort: '-views',
				max_results: TERMS_PER_VIDEO
			}).then(
				(body): YoutubeVideoSearchTerms => ({
					video_id,
					title: video_titles.get(video_id) ?? null,
					search_views: video_search_views,
					terms: read_terms(body)
				})
			)
		)
	);

	return {
		...window,
		total_views,
		search_views,
		terms: read_terms(channel_terms),
		videos
	};
}
