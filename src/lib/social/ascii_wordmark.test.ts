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

	it('sets the caption right-aligned in the bottom row without moving the other dots', () => {
		const plain = build_ascii_wordmark('footer');
		const captioned = build_ascii_wordmark('footer', '1,234 ms');
		const bottom_row = captioned.glyphs.slice(-captioned.columns).join('');
		// A blank cell either side; the last cell is the right margin.
		expect(bottom_row.slice(-11, -1)).toBe(' 1,234 ms ');
		const caption_cells = captioned.kinds.filter((kind) => kind === 'caption');
		// The text plus its blank cell either side.
		expect(caption_cells).toHaveLength(' 1,234 ms '.length);

		const untouched = plain.columns * (plain.rows - 1);
		expect(captioned.glyphs.slice(0, untouched)).toEqual(plain.glyphs.slice(0, untouched));
		expect(captioned.glyphs.at(-1)).toBe(plain.glyphs.at(-1));
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
