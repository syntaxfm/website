import { describe, expect, it } from 'vitest';
import { build_ascii_wordmark, wordmark_layers } from './ascii_wordmark';

describe('build_ascii_wordmark', () => {
	it('is deterministic for a seed', () => {
		expect(build_ascii_wordmark('footer')).toEqual(build_ascii_wordmark('footer'));
	});

	it('keeps the letters and traces fixed while the dot field follows the seed', () => {
		const first = build_ascii_wordmark('footer-0');
		const second = build_ascii_wordmark('footer-1');
		expect(second.kinds).toEqual(first.kinds);
		expect(second.field_levels).not.toEqual(first.field_levels);
	});

	it('fills every cell of the grid', () => {
		const wordmark = build_ascii_wordmark('footer');
		const cells = wordmark.columns * wordmark.rows;
		expect(wordmark.kinds).toHaveLength(cells);
		expect(wordmark.glyphs).toHaveLength(cells);
		expect(wordmark.field_levels).toHaveLength(cells);
	});
});

describe('wordmark_layers', () => {
	it('splits the grid into aligned layers that stack back into the full grid', () => {
		const wordmark = build_ascii_wordmark('footer');
		const layers = Object.values(wordmark_layers(wordmark)).map((layer) =>
			layer.split('\n').map((row) => [...row])
		);
		for (const rows of layers) {
			expect(rows).toHaveLength(wordmark.rows);
			for (const row of rows) expect(row).toHaveLength(wordmark.columns);
		}

		const stacked = wordmark.glyphs.map((_, index) => {
			const row = Math.floor(index / wordmark.columns);
			const column = index % wordmark.columns;
			return layers.map((rows) => rows[row][column]).find((glyph) => glyph !== ' ') ?? ' ';
		});
		expect(stacked.join('')).toBe(wordmark.glyphs.join(''));
	});
});
