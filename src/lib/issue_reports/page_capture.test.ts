import { describe, expect, it } from 'vitest';
import { full_page_rows, is_click, rect_between } from './page_capture';

describe('full_page_rows', () => {
	it('covers a page that fits', () => {
		expect(full_page_rows(1200, 664, 9120)).toEqual({ top: 0, height: 9120 });
	});

	it('takes the slice centered on the screen of a very long page', () => {
		expect(full_page_rows(30_000, 800, 61_766)).toEqual({
			top: 30_000 + 400 - 8192,
			height: 16_384
		});
	});

	it('keeps the slice inside the page at its top and bottom', () => {
		expect(full_page_rows(0, 800, 61_766).top).toBe(0);
		expect(full_page_rows(61_000, 766, 61_766)).toEqual({ top: 61_766 - 16_384, height: 16_384 });
	});
});

describe('rect_between', () => {
	it('is the same rectangle whichever way the drag went', () => {
		const rect = { x: 10, y: 20, width: 90, height: 30 };
		expect(rect_between({ x: 10, y: 20 }, { x: 100, y: 50 })).toEqual(rect);
		expect(rect_between({ x: 100, y: 50 }, { x: 10, y: 20 })).toEqual(rect);
	});
});

describe('is_click', () => {
	it('treats a tiny drag as a click', () => {
		expect(is_click({ x: 0, y: 0, width: 3, height: 5 })).toBe(true);
		expect(is_click({ x: 0, y: 0, width: 3, height: 40 })).toBe(false);
	});
});
