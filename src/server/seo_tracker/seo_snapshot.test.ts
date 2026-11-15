import { describe, expect, it, vi } from 'vitest';
import google_fixture from './fixtures/google_organic.json';
import ranked_fixture from './fixtures/ranked_keywords.json';
import youtube_fixture from './fixtures/youtube_search.json';
import type { AlexandriaOutcome } from './alexandria';
import { build_seo_report, plan_seo_calls } from './seo_snapshot';

vi.mock('$server/db/client', () => ({ db: {} }));

describe('plan_seo_calls', () => {
	it('checks each tracked search on Google and YouTube, after the domain calls', () => {
		const planned = plan_seo_calls(['css podcast']);
		expect(planned.map((plan) => `${plan.kind} ${plan.subject}`)).toEqual([
			'ranked_keywords syntax.fm',
			'competitors syntax.fm',
			'backlinks syntax.fm',
			'google_search css podcast',
			'youtube_search css podcast'
		]);
	});
});

describe('build_seo_report', () => {
	it('fills the report, sums credits and records failed and unreadable calls', () => {
		const planned = plan_seo_calls(['web development podcast']);
		const [ranked, competitors, backlinks, google, youtube] = planned;
		const outcomes: AlexandriaOutcome[] = [
			{ ok: true, call: ranked.call, data: ranked_fixture, credits_cost: 24 },
			{
				ok: false,
				call: competitors.call,
				error: { code: 'provider_unavailable', message: 'DataForSEO is down' }
			},
			{ ok: true, call: backlinks.call, data: { unexpected: true }, credits_cost: 0 },
			{ ok: true, call: google.call, data: google_fixture, credits_cost: 4 },
			{ ok: true, call: youtube.call, data: youtube_fixture, credits_cost: 5 }
		];

		const { report, errors, credits_cost } = build_seo_report(planned, outcomes);

		expect(credits_cost).toBe(33);
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
			'Expected 5 outcomes, got 0'
		);
	});
});
