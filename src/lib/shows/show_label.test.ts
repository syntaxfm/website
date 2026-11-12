import { describe, expect, it } from 'vitest';
import { get_show_label } from './show_label';

describe('get_show_label', () => {
	it('calls the first Monday episode cut from a live stream Syntax Live', () => {
		const label = get_show_label({ show_type: 'HASTY', date: new Date('2026-06-22T00:00:00Z') });

		expect(label).toBe('Syntax Live');
	});

	it('calls a Monday episode from before the live show Syntax Podcast', () => {
		const label = get_show_label({ show_type: 'HASTY', date: new Date('2026-06-15T00:00:00Z') });

		expect(label).toBe('Syntax Podcast');
	});

	it('calls a Wednesday episode Syntax Podcast', () => {
		const label = get_show_label({ show_type: 'TASTY', date: new Date('2026-10-28T00:00:00Z') });

		expect(label).toBe('Syntax Podcast');
	});

	it('reads a date that came through the edge cache as text', () => {
		const label = get_show_label({ show_type: 'HASTY', date: '2026-11-02T00:00:00.000Z' });

		expect(label).toBe('Syntax Live');
	});
});
