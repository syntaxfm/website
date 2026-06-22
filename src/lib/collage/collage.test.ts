import { describe, expect, it } from 'vitest';
import { generate_collage } from './collage';

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
		const numbersOk = [
			...c.dots.flatMap((d) => [d.cx, d.cy, d.r]),
			...c.squares.flatMap((s) => [s.x, s.y, s.size])
		].every(Number.isFinite);
		expect(numbersOk).toBe(true);
	});
});
