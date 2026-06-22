/**
 * Procedural "grunge collage" — the layered, distressed strip the Syntax brand
 * slaps behind black/white blocks (the newsletter form, "React to this!", the
 * SYNTAX wordmark, …). Everything here is pure + deterministic: a seed string maps
 * to a fixed composition (no `Math.random`), so it's stable across SSR/hydration
 * and renders identically every time. `Collage.svelte` turns this data into inline SVG.
 */

/** Deterministic PRNG (mulberry32) — same seed, same stream. */
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function string_seed(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
	return Math.abs(hash) || 1;
}

export interface CollagePalette {
	paper: string;
	ink: string;
	accent: string;
	scratch: string;
}

export const DEFAULT_PALETTE: CollagePalette = {
	paper: '#e7e4df',
	ink: '#111111',
	accent: '#e3352b',
	scratch: '#ffffff'
};

export interface CollageDot {
	cx: number;
	cy: number;
	r: number;
	fill: string;
}

export interface CollageSquare {
	x: number;
	y: number;
	size: number;
	fill: string;
}

export interface CollageShape {
	d: string;
	fill: string;
	opacity: number;
}

export interface CollageStroke {
	d: string;
	width: number;
	stroke: string;
	opacity: number;
}

export interface CollageData {
	width: number;
	height: number;
	/** Torn outline used both as the clip and the paper backing. */
	clip: string;
	dots: CollageDot[];
	squares: CollageSquare[];
	shapes: CollageShape[];
	strokes: CollageStroke[];
	grit: CollageDot[];
}

interface Rng {
	(): number;
	range(min: number, max: number): number;
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
}

function make_rng(seed: number): Rng {
	const next = mulberry32(seed);
	const rng = (() => next()) as Rng;
	rng.range = (min, max) => min + next() * (max - min);
	rng.int = (min, max) => Math.floor(min + next() * (max - min + 1));
	rng.pick = (items) => items[Math.floor(next() * items.length)];
	return rng;
}

/**
 * A torn-paper outline: straight segments meeting at sharply-offset vertices (never
 * wavy), with the occasional deeper notch, and steeply slanted/torn short ends.
 */
function torn_outline(w: number, h: number, rng: Rng): string {
	const pts: Array<[number, number]> = [];
	const long = h * 0.045;
	const short = w * 0.02;

	// Corners pulled in by varying amounts so the two ends slant differently.
	const tl: [number, number] = [rng.range(2, w * 0.05), rng.range(2, h * 0.16)];
	const tr: [number, number] = [w - rng.range(2, w * 0.07), rng.range(2, h * 0.14)];
	const br: [number, number] = [w - rng.range(2, w * 0.04), h - rng.range(2, h * 0.16)];
	const bl: [number, number] = [rng.range(2, w * 0.08), h - rng.range(2, h * 0.12)];

	const tear = (a: [number, number], b: [number, number], n: number, amp: number, nx: number, ny: number) => {
		for (let i = 1; i < n; i++) {
			const t = Math.min(0.97, Math.max(0.03, (i + rng.range(-0.4, 0.4)) / n));
			const bx = a[0] + (b[0] - a[0]) * t;
			const by = a[1] + (b[1] - a[1]) * t;
			const deep = rng() > 0.86 ? rng.range(1.6, 2.4) : 1; // occasional bite
			const off = (rng() * 2 - 1) * amp * deep;
			pts.push([bx + nx * off, by + ny * off]);
		}
	};

	pts.push(tl);
	tear(tl, tr, 15, long, 0, -1);
	pts.push(tr);
	tear(tr, br, 5, short, 1, 0);
	pts.push(br);
	tear(br, bl, 15, long, 0, 1);
	pts.push(bl);
	tear(bl, tl, 5, short, -1, 0);

	return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
}

/**
 * A square/pixel "dither" field — a grid cell is filled with probability driven by a
 * fading density gradient, giving the blocky 1-bit dither patches in the reference.
 */
function dither(
	cx: number,
	cy: number,
	pw: number,
	ph: number,
	fill: string,
	rng: Rng,
	out: CollageSquare[]
): void {
	const cell = rng.range(6.5, 9);
	const flip = rng() > 0.5;
	for (let y = -ph / 2; y <= ph / 2; y += cell) {
		for (let x = -pw / 2; x <= pw / 2; x += cell) {
			let ramp = (x + pw / 2) / pw;
			if (flip) ramp = 1 - ramp;
			const fadeY = Math.min(1, Math.min((y + ph / 2) / ph, (ph / 2 - y) / ph) * 2 * 1.7);
			const density = Math.min(1, Math.max(0, ramp * fadeY + rng.range(-0.1, 0.1)));
			if (rng() < density) {
				const size = cell * rng.range(0.7, 0.98);
				out.push({ x: cx + x, y: cy + y, size, fill });
			}
		}
	}
}

/** A field of halftone dots whose radius fades across the patch (true halftone gradient). */
function halftone(
	cx: number,
	cy: number,
	pw: number,
	ph: number,
	angleDeg: number,
	fill: string,
	rng: Rng,
	out: CollageDot[]
): void {
	const gap = rng.range(7.5, 10);
	const maxR = gap * 0.66;
	const a = (angleDeg * Math.PI) / 180;
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	// Ramp the dot size along one axis, and fade it out toward the top/bottom edges
	// so the patch reads as a soft cloud of halftone rather than a hard rectangle.
	const flip = rng() > 0.5;
	const bias = rng.range(0.15, 0.4);
	for (let y = -ph / 2; y <= ph / 2; y += gap) {
		for (let x = -pw / 2; x <= pw / 2; x += gap) {
			let ramp = (x + pw / 2) / pw;
			if (flip) ramp = 1 - ramp;
			const fadeY = Math.min(1, (Math.min((y + ph / 2) / ph, (ph / 2 - y) / ph) * 2) * 1.7);
			let t = (ramp * (1 - bias) + bias) * fadeY + rng.range(-0.12, 0.12);
			t = Math.min(1, Math.max(0, t));
			const r = maxR * Math.pow(t, 0.9);
			if (r < 0.45) continue;
			const px = x + rng.range(-1.2, 1.2);
			const py = y + rng.range(-1.2, 1.2);
			out.push({ cx: cx + px * ca - py * sa, cy: cy + px * sa + py * ca, r, fill });
		}
	}
}

/** A tangled continuous scribble (smooth Catmull-Rom-ish curve through random points). */
function scribble(cx: number, cy: number, spread: number, knots: number, rng: Rng): string {
	const p: Array<[number, number]> = [];
	for (let i = 0; i < knots; i++) {
		p.push([cx + rng.range(-spread, spread), cy + rng.range(-spread * 0.62, spread * 0.62)]);
	}
	let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
	for (let i = 0; i < p.length - 1; i++) {
		const a = p[i];
		const b = p[i + 1];
		const cpx = (a[0] + b[0]) / 2 + rng.range(-spread * 0.3, spread * 0.3);
		const cpy = (a[1] + b[1]) / 2 + rng.range(-spread * 0.3, spread * 0.3);
		d += `Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
	}
	return d;
}

/** An angular torn polygon (used for the red/black scraps). */
function scrap(cx: number, cy: number, rx: number, ry: number, rng: Rng): string {
	const n = rng.int(4, 7);
	const pts: Array<[number, number]> = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2 + rng.range(-0.3, 0.3);
		const rr = rng.range(0.55, 1);
		pts.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
	}
	return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
}

/** Just the torn-paper outline for a seed — used for the solid backing layer. */
export function torn_paper_path(seed: string, width = 1000, height = 300): string {
	return torn_outline(width, height, make_rng(string_seed(seed)));
}

export function generate_collage(
	seed: string,
	width = 1000,
	height = 300,
	palette: CollagePalette = DEFAULT_PALETTE
): CollageData {
	const rng = make_rng(string_seed(seed));
	const dots: CollageDot[] = [];
	const squares: CollageSquare[] = [];
	const shapes: CollageShape[] = [];
	const strokes: CollageStroke[] = [];
	const grit: CollageDot[] = [];

	// A focal cluster (where the scribble ball + densest ink live) so the strip reads
	// as a composed collage rather than evenly-scattered noise.
	const focal = width * rng.range(0.24, 0.4);

	// 1. Big torn scraps (red + black) bedded behind everything, spread across.
	const scrapCount = rng.int(6, 8);
	for (let i = 0; i < scrapCount; i++) {
		const cx = rng.range(width * 0.04, width * 0.96);
		const cy = rng.range(height * 0.12, height * 0.88);
		shapes.push({
			d: scrap(cx, cy, rng.range(45, 135), rng.range(40, 105), rng),
			fill: rng() > 0.42 ? palette.accent : palette.ink,
			opacity: rng.range(0.8, 1)
		});
	}

	// 2. Overlapping halftone fields tiled across the strip (mostly black, some red).
	const fields = rng.int(6, 8);
	for (let i = 0; i < fields; i++) {
		const fx = (i / (fields - 1)) * width * 0.86 + width * 0.07 + rng.range(-40, 40);
		const fillRed = rng() > 0.68;
		halftone(
			fx,
			height * rng.range(0.4, 0.6),
			rng.range(150, 260),
			height * rng.range(0.7, 1),
			rng.range(-26, 22),
			fillRed ? palette.accent : palette.ink,
			rng,
			dots
		);
	}

	// 2b. Square pixel-dither patches for pattern variety against the round halftone.
	const ditherCount = rng.int(2, 3);
	for (let i = 0; i < ditherCount; i++) {
		dither(
			width * rng.range(0.12, 0.9),
			height * rng.range(0.32, 0.66),
			rng.range(90, 180),
			height * rng.range(0.4, 0.7),
			rng() > 0.7 ? palette.accent : palette.ink,
			rng,
			squares
		);
	}

	// 3. Tangled scribbles — a dense ball at the focal point plus a couple of loose ones.
	strokes.push({
		d: scribble(focal, height * rng.range(0.42, 0.56), rng.range(95, 140), rng.int(44, 60), rng),
		width: rng.range(1.8, 2.8),
		stroke: palette.ink,
		opacity: 1
	});
	const looseScribbles = rng.int(2, 3);
	for (let i = 0; i < looseScribbles; i++) {
		strokes.push({
			d: scribble(width * rng.range(0.18, 0.6), height * rng.range(0.32, 0.62), rng.range(70, 120), rng.int(26, 40), rng),
			width: rng.range(1.5, 2.4),
			stroke: palette.ink,
			opacity: 1
		});
	}

	// 4. White scratch streaks raking across.
	const scratchCount = rng.int(4, 6);
	for (let i = 0; i < scratchCount; i++) {
		const y0 = rng.range(height * 0.25, height * 0.75);
		const x0 = rng.range(width * 0.25, width * 0.5);
		const x1 = x0 + rng.range(width * 0.3, width * 0.5);
		const y1 = y0 + rng.range(-height * 0.2, height * 0.2);
		const mx = (x0 + x1) / 2;
		const my = (y0 + y1) / 2 + rng.range(-12, 12);
		strokes.push({
			d: `M${x0.toFixed(1)},${y0.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
			width: rng.range(1.5, 3.5),
			stroke: palette.scratch,
			opacity: rng.range(0.8, 1)
		});
	}

	// 5. Grit speckle over the whole strip.
	const gritCount = Math.round((width * height) / 1600);
	for (let i = 0; i < gritCount; i++) {
		grit.push({
			cx: rng.range(0, width),
			cy: rng.range(0, height),
			r: rng.range(0.4, 1.5),
			fill: palette.ink
		});
	}

	return {
		width,
		height,
		clip: torn_outline(width, height, rng),
		dots,
		squares,
		shapes,
		strokes,
		grit
	};
}
