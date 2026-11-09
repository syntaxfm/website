import { describe, expect, it } from 'vitest';
import { dots_to_layers, generate_collage, squares_to_layers } from './collage';

describe('generate_collage', () => {
	it('is deterministic for a given seed and size', () => {
		expect(generate_collage('snack', 800, 240)).toEqual(generate_collage('snack', 800, 240));
	});

	it('varies with the seed', () => {
		expect(generate_collage('a', 800, 240).clip).not.toBe(generate_collage('b', 800, 240).clip);
	});

	it('produces a closed clip path and populated layers', () => {
		const c = generate_collage('seed-1', 1000, 300);
		expect(c.clip.startsWith('M')).toBe(true);
		expect(c.clip.endsWith('Z')).toBe(true);
		expect(c.dots.length).toBeGreaterThan(100);
		expect(c.squares.length).toBeGreaterThan(0);
		expect(c.shapes.length).toBeGreaterThan(0);
		expect(c.strokes.length).toBeGreaterThan(0);
		expect(c.grit.length).toBeGreaterThan(0);
	});

	it('emits only finite coordinates', () => {
		const c = generate_collage('finite', 600, 200);
		const numbers_ok = [
			...c.dots.flatMap((d) => [d.cx, d.cy, d.r]),
			...c.squares.flatMap((s) => [s.x, s.y, s.size])
		].every(Number.isFinite);
		expect(numbers_ok).toBe(true);
	});
});

describe('dots_to_layers', () => {
	it('draws every dot once, as a zero-length line', () => {
		const { dots } = generate_collage('seed-1', 1000, 300);
		const layers = dots_to_layers(dots);
		const drawn = layers.reduce((total, layer) => total + layer.d.split('M').length - 1, 0);
		expect(drawn).toBe(dots.length);
		expect(layers.length).toBeLessThan(dots.length / 10);
		expect(layers.every((layer) => /^(M-?[\d.]+ -?[\d.]+h0)+$/.test(layer.d))).toBe(true);
	});

	it('strokes a dot at its diameter, to a tenth of a unit', () => {
		expect(dots_to_layers([{ cx: 10.04, cy: 20.26, r: 3.14, fill: '#111' }])).toEqual([
			{ d: 'M10 20.3h0', stroke: '#111', width: 6.2 }
		]);
	});

	it('keeps colours in paint order', () => {
		const dot = (fill: string, r = 2) => ({ cx: 0, cy: 0, r, fill });
		const layers = dots_to_layers([dot('black'), dot('black', 3), dot('red'), dot('black')]);
		expect(layers.map((layer) => layer.stroke)).toEqual(['black', 'black', 'red', 'black']);
	});
});

describe('squares_to_layers', () => {
	it('draws a run of one colour as a single closed path', () => {
		const square = (x: number, fill: string) => ({ x, y: 5, size: 7.96, fill });
		expect(squares_to_layers([square(1, 'black'), square(20, 'black'), square(40, 'red')])).toEqual(
			[
				{ fill: 'black', d: 'M1 5h8v8h-8zM20 5h8v8h-8z' },
				{ fill: 'red', d: 'M40 5h8v8h-8z' }
			]
		);
	});
});
