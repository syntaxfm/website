import { describe, expect, it } from 'vitest';
import {
	fetch_youtube_search_terms,
	read_analytics_error,
	read_report_rows,
	search_term_window,
	YoutubeAnalyticsError
} from './youtube_search_terms';

// Shaped like YouTube Analytics v2 reports
function report(columns: string[], rows: (string | number)[][]) {
	return { columnHeaders: columns.map((name) => ({ name })), rows };
}

describe('search_term_window', () => {
	it('covers the 28 days ending yesterday', () => {
		expect(search_term_window(new Date('2026-11-19T03:00:00Z'))).toEqual({
			start_date: '2026-10-22',
			end_date: '2026-11-18'
		});
	});
});

describe('read_report_rows', () => {
	it('keys each row by column name', () => {
		expect(
			read_report_rows(report(['insightTrafficSourceDetail', 'views'], [['syntax', 120]]))
		).toEqual([{ insightTrafficSourceDetail: 'syntax', views: 120 }]);
	});

	it('gives no rows for a report with none', () => {
		expect(read_report_rows({ columnHeaders: [{ name: 'views' }] })).toEqual([]);
	});

	it('throws on a response that is not a report', () => {
		expect(() => read_report_rows({})).toThrow('no columns');
	});
});

describe('read_analytics_error', () => {
	const error_body = (reason: string) => ({
		error: { message: 'Request had insufficient authentication scopes.', details: [{ reason }] }
	});

	it('asks for a reconnect when the sign-in lacks analytics access', () => {
		const error = read_analytics_error(403, error_body('ACCESS_TOKEN_SCOPE_INSUFFICIENT'));
		expect(error).toBeInstanceOf(YoutubeAnalyticsError);
		expect(error.code).toBe('missing_analytics_access');
		expect(error.message).toContain('Reconnect YouTube');
	});

	it('names a switched-off API', () => {
		expect(read_analytics_error(403, error_body('SERVICE_DISABLED')).code).toBe(
			'analytics_api_disabled'
		);
	});

	it("keeps Google's message otherwise", () => {
		expect(read_analytics_error(400, { error: { message: 'Bad filter' } })).toMatchObject({
			code: 'youtube_analytics_failed',
			message: 'Bad filter'
		});
	});
});

describe('fetch_youtube_search_terms', () => {
	// Answers each report by its dimensions and filters, and records what was asked
	function fake_youtube() {
		const asked: URL[] = [];
		const fetch_fn = (async (input: string | URL | Request) => {
			const url = new URL(String(input));
			asked.push(url);
			const dimensions = url.searchParams.get('dimensions');
			const filters = url.searchParams.get('filters') ?? '';
			let body: unknown;
			if (dimensions === 'insightTrafficSourceType') {
				body = report(
					['insightTrafficSourceType', 'views'],
					[
						['YT_SEARCH', 300],
						['SUBSCRIBER', 600],
						['RELATED_VIDEO', 100]
					]
				);
			} else if (dimensions === 'video') {
				body = report(['video', 'views'], [['PaS6FUtgAh8', 90]]);
			} else if (filters.startsWith('video==')) {
				body = report(['insightTrafficSourceDetail', 'views'], [['planning a build', 40]]);
			} else {
				body = report(
					['insightTrafficSourceDetail', 'views', 'estimatedMinutesWatched'],
					[
						['syntax', 120, 900],
						['svelte 5', 30, 210]
					]
				);
			}
			return new Response(JSON.stringify(body), { status: 200 });
		}) as typeof fetch;
		return { asked, fetch_fn };
	}

	it('reads the share from search, the top terms and each top video’s terms', async () => {
		const { asked, fetch_fn } = fake_youtube();
		const terms = await fetch_youtube_search_terms(
			'token',
			new Map([['PaS6FUtgAh8', 'Planning A Build']]),
			new Date('2026-11-19T03:00:00Z'),
			fetch_fn
		);

		expect(terms).toEqual({
			start_date: '2026-10-22',
			end_date: '2026-11-18',
			total_views: 1000,
			search_views: 300,
			terms: [
				{ term: 'syntax', views: 120, minutes_watched: 900 },
				{ term: 'svelte 5', views: 30, minutes_watched: 210 }
			],
			videos: [
				{
					video_id: 'PaS6FUtgAh8',
					title: 'Planning A Build',
					search_views: 90,
					terms: [{ term: 'planning a build', views: 40, minutes_watched: null }]
				}
			]
		});
		expect(asked).toHaveLength(4);
		expect(asked.every((url) => url.searchParams.get('ids') === 'channel==MINE')).toBe(true);
		expect(asked.map((url) => url.searchParams.get('filters'))).toContain(
			'video==PaS6FUtgAh8;insightTrafficSourceType==YT_SEARCH'
		);
	});

	it('throws what Google refused', async () => {
		const fetch_fn = (async () =>
			new Response(
				JSON.stringify({
					error: { message: 'nope', details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] }
				}),
				{ status: 403 }
			)) as typeof fetch;
		await expect(
			fetch_youtube_search_terms('token', new Map(), new Date(), fetch_fn)
		).rejects.toMatchObject({ code: 'missing_analytics_access' });
	});
});
