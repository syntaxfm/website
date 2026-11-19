import { describe, expect, it, vi } from 'vitest';
import difficulty_fixture from './fixtures/keyword_difficulty.json';
import google_fixture from './fixtures/google_organic.json';
import ranked_fixture from './fixtures/ranked_keywords.json';
import volume_fixture from './fixtures/search_volume.json';
import youtube_fixture from './fixtures/youtube_search.json';
import type { AlexandriaOutcome } from './alexandria';
import type { SyntaxIdentity } from './seo_parse';
import {
	build_seo_report,
	plan_seo_calls,
	plan_youtube_page_two,
	with_top_100_positions
} from './seo_snapshot';

vi.mock('$server/db/client', () => ({ db: {} }));

const SYNTAX: SyntaxIdentity = {
	domain: 'syntax.fm',
	channel: { id: 'UCyU5wkjgQYGRB0hIHMwm2Sg', name: 'Syntax' },
	video_ids: new Set(),
	titles: new Set()
};

const youtube_page = (channel_names: string[], continuation: string | null) => ({
	continuation,
	videos: channel_names.map((channel_name, index) => ({
		channel_id: null,
		channel_name,
		title: `Video ${index + 1}`,
		url: `https://www.youtube.com/watch?v=video${index}`
	}))
});

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

		const { report, errors, credits_cost } = build_seo_report(planned, outcomes, SYNTAX);

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
		expect(() => build_seo_report(plan_seo_calls(['css podcast']), [], SYNTAX)).toThrow(
			'Expected 7 outcomes, got 0'
		);
	});
});

describe('YouTube page two', () => {
	const planned = plan_seo_calls(['css if statement', 'svelte']).filter(
		(plan) => plan.kind === 'youtube_search'
	);
	const first_pages = [
		youtube_page(['Kevin Powell', 'Theo'], 'next-css'),
		youtube_page(['Syntax'], 'next-svelte')
	];
	const outcomes: AlexandriaOutcome[] = planned.map((plan, index) => ({
		ok: true,
		call: plan.call,
		data: first_pages[index],
		credits_cost: 5
	}));

	it('asks for the second page only where the first has no Syntax video', () => {
		const page_two = plan_youtube_page_two(planned, outcomes);
		expect(page_two).toEqual([
			{
				kind: 'youtube_page_two',
				subject: 'css if statement',
				call: {
					provider: 'youtube-com',
					capability: 'videos/search_videos',
					options: { continuation: 'next-css' }
				}
			}
		]);
	});

	it('counts positions on the second page after the first', () => {
		const page_two = plan_youtube_page_two(planned, outcomes);
		const { report, credits_cost } = build_seo_report(
			[...planned, ...page_two],
			[
				...outcomes,
				{
					ok: true,
					call: page_two[0].call,
					data: youtube_page(['Net Ninja', 'Syntax'], null),
					credits_cost: 5
				}
			],
			SYNTAX
		);
		expect(credits_cost).toBe(15);
		expect(report.youtube_searches.map((check) => [check.search, check.syntax_position])).toEqual([
			['css if statement', 4],
			['svelte', 1]
		]);
	});

	it('keeps the first page when the second fails', () => {
		const page_two = plan_youtube_page_two(planned, outcomes);
		const { report, errors } = build_seo_report(
			[...planned, ...page_two],
			[
				...outcomes,
				{ ok: false, call: page_two[0].call, error: { code: 'timeout', message: 'slow' } }
			],
			SYNTAX
		);
		expect(report.youtube_searches[0]).toMatchObject({
			search: 'css if statement',
			syntax_position: null
		});
		expect(errors).toHaveLength(1);
	});
});

describe('with_top_100_positions', () => {
	const check = (search: string, syntax_position: number | null, syntax_site: string | null) => ({
		search,
		syntax_position,
		syntax_title: null,
		syntax_url: null,
		syntax_site,
		result_types: [],
		top_sites: []
	});

	it('takes the position past the first page from the ranked keywords', () => {
		const checks = with_top_100_positions(
			[
				check('CSS Layers', null, null),
				check('state of js', 3, 'syntax.fm'),
				check('svelte', 2, 'YouTube · Syntax'),
				check('vibe coding', null, null)
			],
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
				},
				{
					keyword: 'svelte',
					search_volume: 40500,
					position: 30,
					url: 'https://syntax.fm/show/800/svelte',
					keyword_difficulty: 40,
					intent: null,
					has_ai_overview: false
				}
			]
		);
		expect(checks.map((item) => [item.search, item.syntax_position, item.syntax_url])).toEqual([
			['CSS Layers', 24, 'https://syntax.fm/show/698/why-you-should-be-using-css-layers'],
			// The live position wins; the ranked keyword fills in the page
			['state of js', 3, 'https://syntax.fm/show/989/state-of-js-2025'],
			// A Syntax YouTube video ranks: syntax.fm's page doesn't stand in for it
			['svelte', 2, null],
			['vibe coding', null, null]
		]);
	});
});
