import { describe, expect, it } from 'vitest';
import {
	format_change,
	format_page,
	format_percent,
	format_position,
	format_position_move,
	format_result_types,
	format_share_change,
	format_volume,
	format_volume_trend
} from './seo_format';

describe('search demand', () => {
	it('shortens volumes', () => {
		expect(format_volume(60500)).toBe('60.5K');
		expect(format_volume(140)).toBe('140');
		expect(format_volume(null)).toBe('–');
	});

	it('shows how a search grew or shrank over the year, or nothing when flat', () => {
		const rising = [100, 100, 100, 150, 200, 250, 300, 350, 400, 400, 400, 400];
		expect(format_volume_trend(rising)).toBe('↑ 4× this year');
		expect(format_volume_trend([100, 100, 100, 130, 130, 130])).toBe('↑ 30% this year');
		expect(format_volume_trend([100, 100, 100, 60, 60, 60])).toBe('↓ 40% this year');
		expect(format_volume_trend([100, 100, 100, 105, 100, 95])).toBe('');
		expect(format_volume_trend([100, 200])).toBe('');
	});

	it('formats the visibility share and its change', () => {
		expect(format_percent(0.041)).toBe('4.1%');
		expect(format_percent(0.25)).toBe('25%');
		expect(format_percent(0)).toBe('0%');
		expect(format_share_change(0.006)).toBe('+0.6 pts');
		expect(format_share_change(-0.012)).toBe('-1.2 pts');
		expect(format_share_change(0)).toBe('');
	});
});

describe('format_position_move', () => {
	it('shows up and down moves (a lower position is better)', () => {
		expect(format_position_move(8, 5)).toBe('▲ 3');
		expect(format_position_move(5, 8)).toBe('▼ 3');
		expect(format_position_move(5, 5)).toBe('');
	});

	it('names entering and leaving the results', () => {
		expect(format_position_move(null, 4)).toBe('new');
		expect(format_position_move(4, null)).toBe('dropped');
		expect(format_position_move(null, null)).toBe('');
	});

	it('shows nothing for a search the earlier snapshot did not check', () => {
		expect(format_position_move(null, 4, false)).toBe('');
	});
});

describe('formatting', () => {
	it('formats positions, changes, pages and result types', () => {
		expect(format_position(3)).toBe('#3');
		expect(format_position(null)).toBe('–');
		expect(format_change(12.4)).toBe('+12');
		expect(format_change(-3)).toBe('-3');
		expect(format_change(0.2)).toBe('');
		expect(format_page('https://syntax.fm/show/900/css')).toBe('/show/900/css');
		expect(format_result_types(['organic', 'ai_overview', 'short_videos'])).toBe(
			'AI Overview · Videos'
		);
	});
});
