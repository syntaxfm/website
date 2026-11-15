import { describe, expect, it } from 'vitest';
import type { DomainOverview } from '$server/seo_tracker/seo_report';
import {
	build_stat_tiles,
	opportunity_rows,
	position_band_rows,
	position_percent,
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
	referring_domains: number | null
): SnapshotSummary {
	return { taken_at: new Date(2026, 10, day), overview: snapshot_overview, referring_domains };
}

describe('build_stat_tiles', () => {
	it('shows the newest value, its change and an oldest-first trend', () => {
		const tiles = build_stat_tiles([
			summary(15, overview(620, 9), 2400),
			summary(8, overview(600, 7), 2323)
		]);

		expect(tiles.find((tile) => tile.label === 'Google keywords')).toEqual({
			label: 'Google keywords',
			value: 620,
			change: 20,
			trend: [600, 620]
		});
		expect(tiles.find((tile) => tile.label === 'On page 1')?.value).toBe(9 + 2 + 10);
		expect(tiles.find((tile) => tile.label === 'Sites linking here')?.change).toBe(77);
	});

	it('has no change for a single snapshot or a missing value', () => {
		const [keywords] = build_stat_tiles([summary(15, overview(620, 9), null)]);
		expect(keywords.change).toBeNull();
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
		expect(position_percent(1, 20)).toBe(0);
		expect(position_percent(20, 20)).toBe(100);
		expect(position_percent(25, 20)).toBe(100);
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

	it('keeps the first opportunities with their position beside the bar', () => {
		const rows = opportunity_rows(
			[
				{ keyword: 'bun javascript', search_volume: 2900, position: 19 },
				{ keyword: 'css scroll animation', search_volume: 480, position: 11 }
			],
			1
		);
		expect(rows).toEqual([
			{
				key: 'bun javascript',
				label: 'bun javascript',
				value: 2900,
				value_text: (2900).toLocaleString(),
				detail: '#19'
			}
		]);
	});
});
