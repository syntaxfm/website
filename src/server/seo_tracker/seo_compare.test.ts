import { describe, expect, it } from 'vitest';
import { compare_reports, find_opportunities, is_on_topic } from './seo_compare';
import type { RankedKeyword, SeoReport } from './seo_report';

function keyword(
	name: string,
	position: number,
	search_volume: number | null = 100
): RankedKeyword {
	return {
		keyword: name,
		search_volume,
		position,
		url: `https://syntax.fm/${name.replaceAll(' ', '-')}`,
		keyword_difficulty: 30,
		intent: 'informational',
		has_ai_overview: false
	};
}

function report(overrides: Partial<SeoReport>): SeoReport {
	return {
		version: 1,
		settings: { domain: 'syntax.fm', location_code: 2840, language_code: 'en' },
		overview: null,
		keywords: [],
		competitors: [],
		backlinks: null,
		google_searches: [],
		youtube_searches: [],
		...overrides
	};
}

const overview = (keyword_count: number, estimated_traffic: number) => ({
	keyword_count,
	estimated_traffic,
	bands: { pos_1: 0, pos_2_3: 0, pos_4_10: 0, pos_11_20: 0, pos_21_100: 0 },
	new_count: 0,
	up_count: 0,
	down_count: 0,
	lost_count: 0
});

describe('compare_reports', () => {
	it('sorts keywords into gained, lost, improved and declined', () => {
		const previous = report({
			keywords: [
				keyword('css grid', 10),
				keyword('svelte runes', 5),
				keyword('old topic', 8),
				keyword('steady', 6)
			]
		});
		const current = report({
			keywords: [
				keyword('css grid', 4),
				keyword('svelte runes', 9),
				keyword('new topic', 12),
				keyword('steady', 7)
			]
		});

		const comparison = compare_reports(previous, current);

		expect(comparison.gained.map((move) => move.keyword)).toEqual(['new topic']);
		expect(comparison.lost).toMatchObject([{ keyword: 'old topic', from: 8, to: null }]);
		expect(comparison.improved).toMatchObject([{ keyword: 'css grid', from: 10, to: 4 }]);
		expect(comparison.declined).toMatchObject([{ keyword: 'svelte runes', from: 5, to: 9 }]);
	});

	it('lists the biggest searches first', () => {
		const comparison = compare_reports(
			report({}),
			report({ keywords: [keyword('small', 3, 10), keyword('big', 3, 5000)] })
		);
		expect(comparison.gained.map((move) => move.keyword)).toEqual(['big', 'small']);
	});

	it('compares totals only when both snapshots have them', () => {
		expect(
			compare_reports(
				report({ overview: overview(600, 300) }),
				report({ overview: overview(620, 280) })
			)
		).toMatchObject({ keyword_count_change: 20, traffic_change: -20 });
		expect(compare_reports(report({}), report({ overview: overview(620, 280) }))).toMatchObject({
			keyword_count_change: null,
			traffic_change: null
		});
	});

	it('marks tracked searches that are new to this snapshot', () => {
		const check = (search: string, syntax_position: number | null) => ({
			search,
			syntax_position,
			syntax_title: null,
			result_types: [],
			top_sites: []
		});
		const comparison = compare_reports(
			report({ google_searches: [check('css podcast', 7)] }),
			report({ google_searches: [check('css podcast', 3), check('svelte podcast', null)] })
		);
		expect(comparison.google).toEqual([
			{ search: 'css podcast', from: 7, to: 3, was_tracked: true },
			{ search: 'svelte podcast', from: null, to: null, was_tracked: false }
		]);
	});
});

describe('is_on_topic', () => {
	const topics = ['CSS', 'JavaScript', 'Web Development', 'Node.js'];

	it('matches topic names as whole words', () => {
		expect(is_on_topic('css grid tutorial', topics)).toBe(true);
		expect(is_on_topic('best web development podcast', topics)).toBe(true);
		expect(is_on_topic('node.js streams', topics)).toBe(true);
	});

	it('ignores keywords with no topic, and topics inside other words', () => {
		expect(is_on_topic('gemma in sons of anarchy', topics)).toBe(false);
		expect(is_on_topic('cssbattle', topics)).toBe(false);
	});
});

describe('find_opportunities', () => {
	it('keeps on-topic keywords at #4–20 with real demand, biggest first', () => {
		const opportunities = find_opportunities(
			[
				keyword('css grid', 6, 900),
				keyword('css nesting', 15, 2400),
				keyword('css tricks', 2, 9000),
				keyword('css layers', 30, 500),
				keyword('css hacks', 8, 5),
				keyword('gemma in sons of anarchy', 9, 3000)
			],
			['CSS']
		);

		expect(opportunities.on_topic.map((item) => item.keyword)).toEqual(['css nesting', 'css grid']);
		expect(opportunities.off_topic_count).toBe(1);
	});
});
