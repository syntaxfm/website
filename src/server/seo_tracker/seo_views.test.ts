import { describe, expect, it } from 'vitest';

import google_fixture from './fixtures/google_organic.json';
import youtube_fixture from './fixtures/youtube_search.json';
import { parse_google_search, parse_youtube_search } from './seo_parse';
import type { GoogleSearchCheck, RankedKeyword, SeoReport, YoutubeSearchCheck } from './seo_report';
import {
	build_seo_opportunities,
	build_seo_overview,
	build_seo_search_detail,
	build_seo_search_rows,
	filter_seo_keywords,
	without_result_detail,
	type SnapshotSummary
} from './seo_views';

const SYNTAX_CHANNEL = { id: 'UCyU5wkjgQYGRB0hIHMwm2Sg', name: 'Syntax' };
const SYNTAX = {
	domain: 'syntax.fm',
	channel: SYNTAX_CHANNEL,
	video_ids: new Set<string>(),
	titles: new Set<string>()
};

function keyword(
	name: string,
	position: number,
	search_volume: number | null,
	keyword_difficulty: number | null = 30
): RankedKeyword {
	return {
		keyword: name,
		search_volume,
		position,
		url: `https://syntax.fm/${name.replaceAll(' ', '-')}`,
		keyword_difficulty,
		intent: 'informational',
		has_ai_overview: false
	};
}

function google(search: string, syntax_position: number | null): GoogleSearchCheck {
	return {
		search,
		syntax_position,
		syntax_title: null,
		syntax_url: syntax_position ? `https://syntax.fm/${search}` : null,
		result_types: ['organic'],
		top_sites: ['example.com']
	};
}

function youtube(search: string, syntax_position: number | null): YoutubeSearchCheck {
	return {
		search,
		syntax_position,
		syntax_video_title: null,
		syntax_video_url: null,
		top_channels: ['Fireship']
	};
}

function summary(overrides: Partial<SnapshotSummary>): SnapshotSummary {
	return {
		taken_at: new Date('2026-11-17T15:00:00Z'),
		overview: null,
		backlinks: null,
		competitors: [],
		google_searches: [],
		youtube_searches: [],
		demand: null,
		...overrides
	};
}

const bands = (pos_1: number) => ({ pos_1, pos_2_3: 2, pos_4_10: 3, pos_11_20: 4, pos_21_100: 5 });
const overview = (keyword_count: number, pos_1: number) => ({
	keyword_count,
	estimated_traffic: keyword_count / 2,
	bands: bands(pos_1),
	new_count: 0,
	up_count: 0,
	down_count: 0,
	lost_count: 0
});

describe('build_seo_overview', () => {
	it('reports totals, visibility and the change since the previous snapshot', () => {
		const previous = summary({
			taken_at: new Date('2026-11-10T15:00:00Z'),
			overview: overview(500, 8),
			backlinks: { rank: 430, backlinks: 100, referring_domains: 2300, broken_backlinks: 1 },
			google_searches: [google('ai engineering', null)],
			youtube_searches: [youtube('ai engineering', null)],
			demand: [
				{ search: 'ai engineering', search_volume: 100, keyword_difficulty: 40, monthly: [] }
			]
		});
		const latest = summary({
			overview: overview(580, 9),
			backlinks: { rank: 432, backlinks: 120, referring_domains: 2334, broken_backlinks: 1 },
			competitors: [
				{ domain: 'github.com', shared_keywords: 354, average_position: 13.9, estimated_traffic: 1 }
			],
			google_searches: [google('ai engineering', 12)],
			youtube_searches: [youtube('ai engineering', null)],
			demand: [
				{ search: 'ai engineering', search_volume: 100, keyword_difficulty: 40, monthly: [] }
			]
		});

		const result = build_seo_overview(latest, previous);

		expect(result).toMatchObject({
			previous_taken_at: previous.taken_at,
			niche_visibility: 1,
			tracked_search_count: 1,
			competitors: [{ domain: 'github.com' }],
			change_since_previous: {
				keyword_count: 80,
				estimated_traffic: 40,
				bands: { pos_1: 1, pos_2_3: 0 },
				niche_visibility: 1,
				referring_domains: 34,
				backlink_rank: 2
			}
		});
		expect(result).not.toHaveProperty('keywords');
	});

	it('has no change for the first snapshot', () => {
		expect(build_seo_overview(summary({}), null).change_since_previous).toBeNull();
	});
});

describe('build_seo_search_rows', () => {
	it('gives each tracked search its positions, their change and its demand', () => {
		const previous = summary({
			google_searches: [google('ai engineering', 15), google('vibe coding', null)],
			youtube_searches: [youtube('ai engineering', 4)]
		});
		const latest = summary({
			google_searches: [google('ai engineering', 12), google('vibe coding', 30)],
			youtube_searches: [youtube('ai engineering', 6), youtube('vibe coding', null)],
			demand: [
				{ search: 'ai engineering', search_volume: 22200, keyword_difficulty: 42, monthly: [1, 2] }
			]
		});

		expect(build_seo_search_rows(latest, previous)).toEqual([
			{
				search: 'ai engineering',
				google_position: 12,
				google_previous_position: 15,
				google_change: 3,
				youtube_position: 6,
				youtube_previous_position: 4,
				youtube_change: -2,
				search_volume: 22200,
				keyword_difficulty: 42,
				google_url: 'https://syntax.fm/ai engineering',
				youtube_url: null
			},
			{
				search: 'vibe coding',
				google_position: 30,
				google_previous_position: null,
				google_change: null,
				youtube_position: null,
				youtube_previous_position: null,
				youtube_change: null,
				search_volume: null,
				keyword_difficulty: null,
				google_url: 'https://syntax.fm/vibe coding',
				youtube_url: null
			}
		]);
	});
});

describe('build_seo_search_detail', () => {
	const detailed_google = parse_google_search('ai engineering', google_fixture, SYNTAX);
	const detailed_youtube = parse_youtube_search(
		'ai engineering',
		[youtube_fixture],
		SYNTAX_CHANNEL
	);
	const history = [
		{
			taken_at: new Date('2026-11-24T15:00:00Z'),
			google: detailed_google,
			youtube: detailed_youtube
		},
		{
			taken_at: new Date('2026-11-17T15:00:00Z'),
			google: google('ai engineering', 4),
			youtube: youtube('ai engineering', null)
		}
	];
	const demand = {
		search: 'ai engineering',
		search_volume: 22200,
		keyword_difficulty: 42,
		monthly: [1]
	};

	it('shows the latest results in detail and the position over time', () => {
		const detail = build_seo_search_detail(history, demand, 'both');

		expect(detail).toMatchObject({
			search: 'ai engineering',
			demand: { search_volume: 22200, keyword_difficulty: 42, monthly_searches_oldest_first: [1] },
			google: {
				syntax_position: 1,
				results_detail_available: true,
				position_history: [
					{ taken_at: history[0].taken_at, position: 1 },
					{ taken_at: history[1].taken_at, position: 4 }
				]
			},
			youtube: {
				syntax_position: 3,
				results_detail_available: true,
				position_history: [
					{ taken_at: history[0].taken_at, position: 3 },
					{ taken_at: history[1].taken_at, position: null }
				]
			}
		});
		expect(detail.youtube?.top_results?.[0]).toMatchObject({
			channel_name: 'JavaScript Conferences by GitNation',
			view_count: 14344
		});
	});

	it('says when a snapshot predates result detail, and falls back to the top names', () => {
		const detail = build_seo_search_detail(history.slice(1), null, 'google');

		expect(detail.google).toMatchObject({
			results_detail_available: false,
			top_sites: ['example.com'],
			top_results: null
		});
		expect(detail).not.toHaveProperty('youtube');
		expect(detail.demand).toBeNull();
	});
});

describe('filter_seo_keywords', () => {
	const keywords = [
		keyword('css grid', 12, 900, 50),
		keyword('svelte runes', 3, 300, 10),
		keyword('sons of anarchy gemma', 40, 5000, 20),
		keyword('css nesting', 25, null, null)
	];
	const topics = ['CSS', 'Svelte'];
	const defaults = { on_topic_only: true, sort: 'volume' as const, limit: 25, offset: 0 };

	it('keeps on-topic keywords, most searched first', () => {
		const result = filter_seo_keywords(keywords, topics, defaults);
		expect(result.total_matches).toBe(3);
		expect(result.items.map((item) => item.keyword)).toEqual([
			'css grid',
			'svelte runes',
			'css nesting'
		]);
	});

	it('filters by text, volume and position, and pages', () => {
		expect(
			filter_seo_keywords(keywords, topics, { ...defaults, query: 'CSS', min_volume: 1 }).items
		).toHaveLength(1);
		expect(
			filter_seo_keywords(keywords, topics, { ...defaults, position_min: 10, position_max: 30 })
				.total_matches
		).toBe(2);
		const second_page = filter_seo_keywords(keywords, topics, { ...defaults, limit: 1, offset: 1 });
		expect(second_page.items.map((item) => item.keyword)).toEqual(['svelte runes']);
	});

	it('sorts by position or difficulty, and can include everything', () => {
		const everything = { ...defaults, on_topic_only: false };
		expect(
			filter_seo_keywords(keywords, topics, { ...everything, sort: 'position' }).items[0].keyword
		).toBe('svelte runes');
		expect(
			filter_seo_keywords(keywords, topics, { ...everything, sort: 'difficulty' }).items.map(
				(item) => item.keyword
			)
		).toEqual(['svelte runes', 'sons of anarchy gemma', 'css grid', 'css nesting']);
	});
});

describe('build_seo_opportunities', () => {
	it('lists striking-distance on-topic keywords, at most limit', () => {
		const keywords = [
			keyword('css grid', 12, 900),
			keyword('css subgrid', 8, 400),
			keyword('svelte runes', 2, 300),
			keyword('sons of anarchy gemma', 15, 5000)
		];

		expect(build_seo_opportunities(keywords, ['CSS', 'Svelte'], 1)).toMatchObject({
			on_topic_count: 2,
			off_topic_count: 1,
			items: [{ keyword: 'css grid' }]
		});
	});
});

describe('without_result_detail', () => {
	it('drops each search’s result detail and keeps everything else', () => {
		const report: SeoReport = {
			version: 1,
			settings: { domain: 'syntax.fm', location_code: 2840, language_code: 'en' },
			overview: null,
			keywords: [],
			competitors: [],
			backlinks: null,
			google_searches: [parse_google_search('ai engineering', google_fixture, SYNTAX)],
			youtube_searches: [parse_youtube_search('ai engineering', [youtube_fixture], SYNTAX_CHANNEL)]
		};

		const stripped = without_result_detail(report);

		expect(stripped.google_searches[0]).not.toHaveProperty('top_results');
		expect(stripped.youtube_searches[0]).not.toHaveProperty('top_results');
		expect(stripped.youtube_searches[0].top_channels).toEqual(
			report.youtube_searches[0].top_channels
		);
	});
});
