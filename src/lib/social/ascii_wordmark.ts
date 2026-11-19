/**
 * The footer SYNTAX wordmark as real text: block letters (█), double-line circuit
 * traces (═ ║ ╔ …) hugging each letter's right and bottom edges, and a seeded dot field
 * in the gaps. Pure and deterministic, so the server and the hydrated page agree.
 */

import { make_rng, string_seed } from '#lib/utils/seeded_random.ts';

export type WordmarkCellKind = 'letter' | 'trace' | 'field';

export interface AsciiWordmark {
	columns: number;
	rows: number;
	/** Row-major, `columns * rows` long. */
	kinds: WordmarkCellKind[];
	glyphs: string[];
	/** Field cells only: 0 (blank) to 2 (dense), an index into FIELD_RAMP. */
	field_levels: number[];
}

/** 5-row pixel letters; `#` is a pixel. */
const LETTERS: Record<string, readonly string[]> = {
	S: ['.####', '#....', '.###.', '....#', '####.'],
	Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
	N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
	T: ['#####', '..#..', '..#..', '..#..', '..#..'],
	A: ['.###.', '#...#', '#####', '#...#', '#...#'],
	X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#']
};

const WORD = 'SYNTAX';
/** A pixel is two characters wide, so it reads square with a 0.6em-wide glyph. */
const PIXEL_COLUMNS = 2;
const LETTER_GAP_PIXELS = 1;
const MARGIN_COLUMNS = 2;
const MARGIN_TOP_ROWS = 1;
const MARGIN_BOTTOM_ROWS = 2;
const LETTER_ROWS = 5;

const BLOCK = '█';
/** Dot-field density, sparse to dense. Pointer heat walks further up this ramp. */
export const FIELD_RAMP = [' ', '·', ':', '+', '*', '#'] as const;
/** What a cell flickers through before it settles. */
export const DECODE_GLYPHS = '░▒▓█<>/\\[]{}=+*#%&$@!?';

// Neighbour bits: up 1, down 2, left 4, right 8.
const TRACE_GLYPHS: Record<number, string> = {
	0: '═',
	1: '║',
	2: '║',
	3: '║',
	4: '═',
	8: '═',
	12: '═',
	5: '╝',
	6: '╗',
	9: '╚',
	10: '╔',
	7: '╣',
	11: '╠',
	13: '╩',
	14: '╦',
	15: '╬'
};

function letter_pixels(): { columns: number; pixels: Set<string> } {
	const pixels = new Set<string>();
	let left = MARGIN_COLUMNS;
	for (const letter of WORD) {
		const rows = LETTERS[letter];
		const width = rows[0].length;
		rows.forEach((line, row) => {
			[...line].forEach((pixel, pixel_column) => {
				if (pixel !== '#') return;
				for (let offset = 0; offset < PIXEL_COLUMNS; offset++) {
					pixels.add(`${MARGIN_TOP_ROWS + row},${left + pixel_column * PIXEL_COLUMNS + offset}`);
				}
			});
		});
		left += (width + LETTER_GAP_PIXELS) * PIXEL_COLUMNS;
	}
	const columns = left - LETTER_GAP_PIXELS * PIXEL_COLUMNS + MARGIN_COLUMNS;
	return { columns, pixels };
}

export function build_ascii_wordmark(seed: string): AsciiWordmark {
	const { columns, pixels } = letter_pixels();
	const rows = MARGIN_TOP_ROWS + LETTER_ROWS + MARGIN_BOTTOM_ROWS;
	const is_letter = (row: number, column: number) => pixels.has(`${row},${column}`);

	// Traces: the letters' shadow one cell right and down, minus the letters themselves.
	const traces = new Set<string>();
	for (const key of pixels) {
		const [row, column] = key.split(',').map(Number);
		for (const [down, right] of [
			[0, 1],
			[1, 0],
			[1, 1]
		]) {
			if (!is_letter(row + down, column + right)) traces.add(`${row + down},${column + right}`);
		}
	}
	const is_trace = (row: number, column: number) => traces.has(`${row},${column}`);

	// Dot field: a few soft clouds plus a light sprinkle, so the gaps read like a halftone.
	const rng = make_rng(string_seed(seed));
	const clouds = Array.from({ length: rng.int(5, 8) }, () => ({
		column: rng.range(0, columns),
		row: rng.range(0, rows),
		radius: rng.range(6, 16)
	}));
	// A row is about twice as tall as a column is wide.
	const ROW_STRETCH = 2.2;

	const kinds: WordmarkCellKind[] = [];
	const glyphs: string[] = [];
	const field_levels: number[] = [];
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			if (is_letter(row, column)) {
				kinds.push('letter');
				glyphs.push(BLOCK);
				field_levels.push(0);
				continue;
			}
			if (is_trace(row, column)) {
				const mask =
					(is_trace(row - 1, column) ? 1 : 0) |
					(is_trace(row + 1, column) ? 2 : 0) |
					(is_trace(row, column - 1) ? 4 : 0) |
					(is_trace(row, column + 1) ? 8 : 0);
				kinds.push('trace');
				glyphs.push(TRACE_GLYPHS[mask]);
				field_levels.push(0);
				continue;
			}
			let density = 0;
			for (const cloud of clouds) {
				const distance = Math.hypot(column - cloud.column, (row - cloud.row) * ROW_STRETCH);
				density = Math.max(density, 1 - distance / cloud.radius);
			}
			density += rng.range(-0.15, 0.15);
			const level = density > 0.55 ? 2 : density > 0.2 || rng() < 0.12 ? 1 : 0;
			kinds.push('field');
			glyphs.push(FIELD_RAMP[level]);
			field_levels.push(level);
		}
	}

	return { columns, rows, kinds, glyphs, field_levels };
}

/**
 * One cell's glyph in an animation frame.
 * `reveal` is the cell's decode progress: below 0 it hasn't started (blank), 0–1 it
 * flickers through random glyphs, 1 and up it has settled.
 * `heat` (0–1) is pointer warmth: it thickens the dot field and makes letters shimmer.
 */
export function frame_glyph(
	wordmark: AsciiWordmark,
	index: number,
	reveal: number,
	heat: number,
	random: () => number
): string {
	if (reveal < 0) return ' ';
	if (reveal < 1) return DECODE_GLYPHS[Math.floor(random() * DECODE_GLYPHS.length)];
	const kind = wordmark.kinds[index];
	if (kind === 'field') {
		const heated = Math.ceil(heat * (FIELD_RAMP.length - 1));
		return FIELD_RAMP[Math.max(wordmark.field_levels[index], heated)];
	}
	if (kind === 'letter' && heat > 0.5 && random() < heat * 0.5) return '▓';
	return wordmark.glyphs[index];
}

export type WordmarkLayers = Record<WordmarkCellKind, string>;

/**
 * Splits glyphs into one text layer per cell kind, so each can be styled on its own,
 * with spaces holding the other layers' cells open. Stacked, they make the full grid.
 */
export function wordmark_layers(
	wordmark: AsciiWordmark,
	glyphs: readonly string[] = wordmark.glyphs
): WordmarkLayers {
	const layers: WordmarkLayers = { letter: '', trace: '', field: '' };
	const kinds = Object.keys(layers) as WordmarkCellKind[];
	wordmark.kinds.forEach((cell_kind, index) => {
		const is_row_end = (index + 1) % wordmark.columns === 0 && index + 1 < wordmark.kinds.length;
		for (const kind of kinds) {
			layers[kind] += (kind === cell_kind ? glyphs[index] : ' ') + (is_row_end ? '\n' : '');
		}
	});
	return layers;
}
