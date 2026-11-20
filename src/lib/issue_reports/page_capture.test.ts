import { describe, expect, it } from 'vitest';
import { is_click, rect_between, viewport_in_frame } from './page_capture';

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

describe('viewport_in_frame', () => {
	it('scales the viewport onto a frame of the same shape', () => {
		expect(viewport_in_frame({ width: 2880, height: 1800 }, { width: 1440, height: 900 })).toEqual({
			x: 0,
			y: 0,
			scale: 2
		});
	});

	it('finds the viewport inside a letterboxed frame', () => {
		// The tab got shorter after the capture started, so Chrome pads it left and right
		expect(viewport_in_frame({ width: 1440, height: 900 }, { width: 1440, height: 1000 })).toEqual({
			x: 72,
			y: 0,
			scale: 0.9
		});
	});
});
