import { describe, expect, it, vi } from 'vitest';
import difficulty_fixture from './fixtures/keyword_difficulty.json';
import google_fixture from './fixtures/google_organic.json';
import ranked_fixture from './fixtures/ranked_keywords.json';
import volume_fixture from './fixtures/search_volume.json';
import youtube_fixture from './fixtures/youtube_search.json';
import type { AlexandriaOutcome } from './alexandria';
import { build_seo_report, plan_seo_calls, with_top_100_positions } from './seo_snapshot';

vi.mock('$server/db/client', () => ({ db: {} }));

describe('plan_seo_calls', () => {
	it('gets demand for the tracked searches, then checks each on Google and YouTube', () => {
		const planned = plan_seo_calls(['css podcast']);
		expect(planned.map((plan) => `${plan.kind} ${plan.subject}`)).toEqual([
			'ranked_keywords syntax.fm',
			'competitors syntax.fm',
			'backlinks syntax.fm',
			'search_volume tracked searches',
			'keyword_difficulty tracked searches',
			'google_search css podcast',
			'youtube_search css podcast'
		]);
	});
});

describe('build_seo_report', () => {
	it('fills the report, sums credits and records failed and unreadable calls', () => {
		const planned = plan_seo_calls(['web development podcast']);
		const [ranked, competitors, backlinks, volume, difficulty, google, youtube] = planned;
		const outcomes: AlexandriaOutcome[] = [
			{ ok: true, call: ranked.call, data: ranked_fixture, credits_cost: 24 },
			{
				ok: false,
				call: competitors.call,
				error: { code: 'provider_unavailable', message: 'DataForSEO is down' }
			},
			{ ok: true, call: backlinks.call, data: { unexpected: true }, credits_cost: 0 },
			{ ok: true, call: volume.call, data: volume_fixture, credits_cost: 40 },
			{ ok: true, call: difficulty.call, data: difficulty_fixture, credits_cost: 13 },
			{ ok: true, call: google.call, data: google_fixture, credits_cost: 4 },
			{ ok: true, call: youtube.call, data: youtube_fixture, credits_cost: 5 }
		];

		const { report, errors, credits_cost } = build_seo_report(planned, outcomes);

		expect(credits_cost).toBe(86);
		expect(report.demand).toEqual([
			{
				search: 'web development podcast',
				search_volume: 30,
				keyword_difficulty: 0,
				monthly: expect.any(Array)
			}
		]);
		expect(report.demand?.[0].monthly).toHaveLength(12);
		expect(report.overview?.keyword_count).toBe(604);
		expect(report.keywords).toHaveLength(3);
		expect(report.competitors).toEqual([]);
		expect(report.backlinks).toBeNull();
		expect(report.google_searches[0].syntax_position).toBe(1);
		expect(report.youtube_searches[0].syntax_position).toBe(3);
		expect(errors).toEqual([
			{
				capability: 'dataforseo domains/competitors',
				subject: 'syntax.fm',
				code: 'provider_unavailable',
				message: 'DataForSEO is down'
			},
			expect.objectContaining({
				capability: 'dataforseo backlinks/summary',
				code: 'unreadable_response'
			})
		]);
	});

	it('refuses outcomes that do not line up with the plan', () => {
		expect(() => build_seo_report(plan_seo_calls(['css podcast']), [])).toThrow(
			'Expected 7 outcomes, got 0'
		);
	});
});

describe('with_top_100_positions', () => {
	const check = (search: string, syntax_position: number | null) => ({
		search,
		syntax_position,
		syntax_title: null,
		syntax_url: null,
		result_types: [],
		top_sites: []
	});

	it('takes the position past the top 20 from the ranked keywords', () => {
		const checks = with_top_100_positions(
			[check('CSS Layers', null), check('state of js', 3), check('vibe coding', null)],
			[
				{
					keyword: 'css layers',
					search_volume: 720,
					position: 24,
					url: 'https://syntax.fm/show/698/why-you-should-be-using-css-layers',
					keyword_difficulty: 15,
					intent: null,
					has_ai_overview: false
				},
				{
					keyword: 'state of js',
					search_volume: 320,
					position: 4,
					url: 'https://syntax.fm/show/989/state-of-js-2025',
					keyword_difficulty: 11,
					intent: null,
					has_ai_overview: false
				}
			]
		);
		expect(checks.map((item) => [item.search, item.syntax_position, item.syntax_url])).toEqual([
			['CSS Layers', 24, 'https://syntax.fm/show/698/why-you-should-be-using-css-layers'],
			// The live check wins over the ranked keywords
			['state of js', 3, null],
			['vibe coding', null, null]
		]);
	});
});
