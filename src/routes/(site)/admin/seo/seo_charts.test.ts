import { describe, expect, it } from 'vitest';
import type { DomainOverview } from '$server/seo_tracker/seo_report';
import {
	build_stat_tiles,
	build_tracked_rows,
	group_tracked_rows,
	position_band_rows,
	position_history_runs,
	position_percent,
	rank_tier,
	search_term_rows,
	sparkline_points,
	type SnapshotSummary
} from './seo_charts';

function overview(keyword_count: number, pos_1: number): DomainOverview {
	return {
		keyword_count,
		estimated_traffic: keyword_count / 2,
		bands: { pos_1, pos_2_3: 2, pos_4_10: 10, pos_11_20: 20, pos_21_100: 100 },
		new_count: 0,
		up_count: 0,
		down_count: 0,
		lost_count: 0
	};
}

function summary(
	day: number,
	snapshot_overview: DomainOverview | null,
	referring_domains: number | null,
	niche_visibility: number | null = null
): SnapshotSummary {
	return {
		taken_at: new Date(2026, 10, day),
		overview: snapshot_overview,
		referring_domains,
		niche_visibility,
		google_searches: [],
		youtube_searches: [],
		spotify_searches: []
	};
}

const google_check = (search: string, syntax_position: number | null) => ({
	search,
	syntax_position,
	syntax_title: null,
	syntax_url: syntax_position === null ? null : `https://syntax.fm/show/1/${search}`,
	result_types: [],
	top_sites: []
});

const youtube_check = (search: string, syntax_position: number | null) => ({
	search,
	syntax_position,
	syntax_video_title: null,
	syntax_video_url: null,
	top_channels: []
});

const spotify_check = (search: string, show: number | null, episode: number | null) => ({
	search,
	syntax_show_position: show,
	syntax_episode_position: episode,
	syntax_episode_title: episode === null ? null : 'Mourning the Death of Code',
	syntax_episode_url:
		episode === null ? null : 'https://open.spotify.com/episode/12g4lXEKt55L5R36tIvGAy',
	top_shows: []
});

describe('build_stat_tiles', () => {
	it('shows the newest value, its change and an oldest-first trend', () => {
		const tiles = build_stat_tiles([
			summary(15, overview(620, 9), 2400, 0.05),
			summary(8, overview(600, 7), 2323, 0.04)
		]);

		expect(tiles[0]).toMatchObject({ label: 'Niche visibility', format: 'percent', value: 0.05 });
		expect(tiles.find((tile) => tile.label === 'Google keywords')).toEqual({
			label: 'Google keywords',
			format: 'count',
			value: 620,
			change: 20,
			trend: [600, 620]
		});
		expect(tiles.find((tile) => tile.label === 'On page 1')?.value).toBe(9 + 2 + 10);
		expect(tiles.find((tile) => tile.label === 'Sites linking here')?.change).toBe(77);
	});

	it('has no change for a single snapshot or a missing value', () => {
		const keywords = build_stat_tiles([summary(15, overview(620, 9), null)]).find(
			(tile) => tile.label === 'Google keywords'
		);
		expect(keywords?.change).toBeNull();
		const linking = build_stat_tiles([summary(15, null, null)]).at(-1);
		expect(linking).toMatchObject({ value: null, trend: [] });
	});
});

describe('sparkline_points', () => {
	it('puts higher values higher, inside the inset', () => {
		const points = sparkline_points([10, 30, 20], 120, 32, 5);
		expect(points.map((point) => point.x)).toEqual([5, 60, 115]);
		expect(points[1].y).toBe(5);
		expect(points[0].y).toBe(27);
	});

	it('draws a flat line through the middle', () => {
		expect(sparkline_points([4, 4], 120, 32).map((point) => point.y)).toEqual([16, 16]);
	});
});

describe('position_percent', () => {
	it('maps #1 to the left edge and the last position to the right', () => {
		expect(position_percent(1, 100)).toBe(0);
		expect(position_percent(100, 100)).toBe(100);
		expect(position_percent(150, 100)).toBe(100);
	});

	it('gives #1–10 as much room as #10–100', () => {
		expect(position_percent(10, 100)).toBeCloseTo(50);
	});
});

describe('build_tracked_rows', () => {
	it('joins each search with its demand, YouTube and Spotify results and history', () => {
		const rows = build_tracked_rows(
			{
				google_searches: [google_check('vibe coding', 42)],
				youtube_searches: [youtube_check('vibe coding', null)],
				spotify_searches: [spotify_check('vibe coding', 7, 12)],
				demand: [
					{ search: 'vibe coding', search_volume: 110000, keyword_difficulty: 35, monthly: [] }
				]
			},
			[
				{
					...summary(15, null, null),
					google_searches: [google_check('vibe coding', 42)],
					youtube_searches: [youtube_check('vibe coding', null)],
					spotify_searches: [spotify_check('vibe coding', 7, 12)]
				},
				// Before Spotify was tracked
				{
					...summary(8, null, null),
					google_searches: [google_check('vibe coding', null)],
					youtube_searches: [youtube_check('vibe coding', 18)]
				},
				// Before the search was tracked
				summary(1, null, null)
			]
		);

		expect(rows).toEqual([
			{
				search: 'vibe coding',
				demand: {
					search: 'vibe coding',
					search_volume: 110000,
					keyword_difficulty: 35,
					monthly: []
				},
				google: {
					position: 42,
					url: 'https://syntax.fm/show/1/vibe coding',
					title: null
				},
				youtube: { position: null, url: null, title: null },
				spotify: {
					position: 12,
					url: 'https://open.spotify.com/episode/12g4lXEKt55L5R36tIvGAy',
					title: 'Mourning the Death of Code'
				},
				spotify_show_position: 7,
				google_history: [null, 42],
				youtube_history: [18, null],
				spotify_history: [null, 12]
			}
		]);
	});

	it('has no Spotify placement for a snapshot without Spotify', () => {
		const [row] = build_tracked_rows(
			{
				google_searches: [google_check('vibe coding', 42)],
				youtube_searches: [youtube_check('vibe coding', null)]
			},
			[{ ...summary(15, null, null), google_searches: [google_check('vibe coding', 42)] }]
		);
		expect(row).toMatchObject({
			spotify: null,
			spotify_show_position: null,
			spotify_history: [null]
		});
	});
});

describe('rank_tier', () => {
	it('sorts positions into top 3, page 1, deeper and not found', () => {
		expect([1, 3, 4, 10, 11, null].map(rank_tier)).toEqual([
			'top',
			'top',
			'page',
			'page',
			'deep',
			'none'
		]);
	});
});

describe('group_tracked_rows', () => {
	it('puts rows under their topic in its order, with unlisted searches last', () => {
		const [vibe, node, old] = ['vibe coding', 'node.js', 'old search'].map(
			(search) =>
				build_tracked_rows(
					{ google_searches: [google_check(search, 5)], youtube_searches: [] },
					[]
				)[0]
		);
		const groups = group_tracked_rows(
			[old, node, vibe],
			[
				{ label: 'AI engineering', searches: ['vibe coding', 'claude code'] },
				{ label: 'Development', searches: ['node.js'] },
				{ label: 'Podcast', searches: ['coding podcast'] }
			]
		);
		expect(groups.map((group) => [group.label, group.rows.map((row) => row.search)])).toEqual([
			['AI engineering', ['vibe coding']],
			['Development', ['node.js']],
			['Other', ['old search']]
		]);
	});
});

describe('position_history_runs', () => {
	it('puts #1 at the top and breaks the line where Syntax was not found', () => {
		const runs = position_history_runs([1, 100, null, 10], 100, 62, 24, 4);
		expect(runs).toEqual([
			[
				{ x: 4, y: 4 },
				{ x: 22, y: 20 }
			],
			[{ x: 58, y: 12 }]
		]);
	});
});

describe('bar rows', () => {
	it('lists position ranges best first', () => {
		expect(position_band_rows(overview(604, 9)).map((row) => [row.label, row.value])).toEqual([
			['#1', 9],
			['#2–3', 2],
			['#4–10 (rest of page 1)', 10],
			['#11–20 (page 2)', 20],
			['#21–100', 100]
		]);
	});

	it('lists YouTube search terms with the watch hours they brought', () => {
		expect(
			search_term_rows([
				{ term: 'syntax', views: 1200, minutes_watched: 5430 },
				{ term: 'svelte 5', views: 80, minutes_watched: null }
			]).map((row) => [row.label, row.value, row.detail])
		).toEqual([
			['syntax', 1200, '91 h'],
			['svelte 5', 80, undefined]
		]);
	});
});
