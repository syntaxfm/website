import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { has_show_number, is_complete_episode, is_released } from './released';

describe('is_released', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-18T21:00:00Z'));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows published content once its date has come', () => {
		expect(
			is_released({ status: 'PUBLISHED', published_at: new Date('2026-11-18T12:00:00Z') })
		).toBe(true);
		expect(is_released({ status: 'PUBLISHED', published_at: '2026-11-18T21:00:00Z' })).toBe(true);
	});

	it('hides scheduled content', () => {
		expect(
			is_released({ status: 'PUBLISHED', published_at: new Date('2026-11-23T11:00:00Z') })
		).toBe(false);
	});

	it('hides a draft, even one dated in the past', () => {
		expect(is_released({ status: 'DRAFT', published_at: new Date('2026-11-01T12:00:00Z') })).toBe(
			false
		);
		expect(
			is_released({ status: 'ARCHIVED', published_at: new Date('2026-11-01T12:00:00Z') })
		).toBe(false);
	});

	it('hides content with no date or no row', () => {
		expect(is_released({ status: 'PUBLISHED', published_at: null })).toBe(false);
		expect(is_released(null)).toBe(false);
		expect(is_released(undefined)).toBe(false);
	});
});

describe('episode narrowing', () => {
	it('keeps episodes with a number, and with audio when asked', () => {
		const episodes = [
			{ number: 900, url: 'https://example.com/900.mp3' },
			{ number: null, url: 'https://example.com/draft.mp3' },
			{ number: 901, url: null }
		];
		expect(episodes.filter(has_show_number).map((e) => e.number)).toEqual([900, 901]);
		expect(episodes.filter(is_complete_episode).map((e) => e.number)).toEqual([900]);
	});
});
