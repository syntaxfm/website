import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { is_released } from './released';

describe('is_released', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-18T21:00:00Z'));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows an episode once its date has come', () => {
		expect(is_released(new Date('2026-11-18T12:00:00Z'))).toBe(true);
		expect(is_released('2026-11-18T21:00:00Z')).toBe(true);
	});

	it('hides a scheduled episode', () => {
		expect(is_released(new Date('2026-11-23T11:00:00Z'))).toBe(false);
	});

	it('hides one with no date', () => {
		expect(is_released(null)).toBe(false);
		expect(is_released(undefined)).toBe(false);
	});
});
