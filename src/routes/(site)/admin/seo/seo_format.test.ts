import { describe, expect, it } from 'vitest';
import {
	format_change,
	format_page,
	format_position,
	format_position_move,
	format_result_types
} from './seo_format';

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
