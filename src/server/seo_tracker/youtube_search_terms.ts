import { as_array, as_number, as_string, read_path } from '#lib/utils/narrow.ts';
import type { YoutubeSearchTerm, YoutubeSearchTerms, YoutubeVideoSearchTerms } from './seo_report';

// What people typed into YouTube search before watching a Syntax video, from YouTube Analytics
// (first-party, free). It acts as the channel's owner, so YouTube must be connected in admin with
// analytics access (src/server/video/youtube_owner.ts). YouTube only gives the top 25 terms per
// report, so the channel's top terms come with each top video's own.

const REPORTS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports';
const SEARCH_SOURCE = 'YT_SEARCH';
// YouTube's most terms per report
const TERMS_PER_REPORT = 25;
// Videos most found through search that get their own terms
const TOP_VIDEO_COUNT = 10;
const TERMS_PER_VIDEO = 10;
// The window ends yesterday, since YouTube's numbers for today are still filling in
export const SEARCH_TERM_DAYS = 28;

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
	return new YoutubeAnalyticsError('youtube_analytics_failed', message);
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
	window: { start_date: string; end_date: string },
	query: ReportQuery,
	fetch_fn: typeof fetch
): Promise<unknown> {
	const url = new URL(REPORTS_URL);
	url.search = new URLSearchParams({
		ids: 'channel==MINE',
		startDate: window.start_date,
		endDate: window.end_date,
		dimensions: query.dimensions,
		metrics: query.metrics,
		...(query.filters ? { filters: query.filters } : {}),
		...(query.sort ? { sort: query.sort } : {}),
		...(query.max_results ? { maxResults: String(query.max_results) } : {})
	}).toString();
	const response = await fetch_fn(url, { headers: { authorization: `Bearer ${access_token}` } });
	const body: unknown = await response.json();
	if (!response.ok) throw read_analytics_error(response.status, body);
	return body;
}

/**
 * The channel's top YouTube search terms over the last 28 days, how many views came from search,
 * and the top terms for each of the videos search found most. `video_titles` names the videos.
 */
export async function fetch_youtube_search_terms(
	access_token: string,
	video_titles: ReadonlyMap<string, string>,
	today: Date = new Date(),
	fetch_fn: typeof fetch = fetch
): Promise<YoutubeSearchTerms> {
	const window = search_term_window(today);
	const report = (query: ReportQuery) => fetch_report(access_token, window, query, fetch_fn);

	const [sources, channel_terms, top_videos] = await Promise.all([
		report({ dimensions: 'insightTrafficSourceType', metrics: 'views' }),
		report({
			dimensions: 'insightTrafficSourceDetail',
			metrics: 'views,estimatedMinutesWatched',
			filters: `insightTrafficSourceType==${SEARCH_SOURCE}`,
			sort: '-views',
			max_results: TERMS_PER_REPORT
		}),
		report({
			dimensions: 'video',
			metrics: 'views',
			filters: `insightTrafficSourceType==${SEARCH_SOURCE}`,
			sort: '-views',
			max_results: TOP_VIDEO_COUNT
		})
	]);

	const source_rows = read_report_rows(sources);
	const view_count = (row: (typeof source_rows)[number]) =>
		typeof row.views === 'number' ? row.views : 0;
	const total_views = source_rows.reduce((total, row) => total + view_count(row), 0);
	const search_views = source_rows
		.filter((row) => row.insightTrafficSourceType === SEARCH_SOURCE)
		.reduce((total, row) => total + view_count(row), 0);

	const videos = await Promise.all(
		read_report_rows(top_videos).flatMap((row) => {
			const video_id = row.video;
			if (typeof video_id !== 'string') return [];
			return [
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
						search_views: typeof row.views === 'number' ? row.views : 0,
						terms: read_terms(body)
					})
				)
			];
		})
	);

	return {
		...window,
		total_views,
		search_views,
		terms: read_terms(channel_terms),
		videos
	};
}
