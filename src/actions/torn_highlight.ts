import type { Action } from 'svelte/action';
import { string_hash } from '$lib/utils/string_hash';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface TornParams {
	/** The text being highlighted — used to seed the procedural cuts. */
	text: string;
	/** Tilt applied to the whole highlight + text, e.g. "-1.5deg". */
	tilt: string;
}

/** Deterministic PRNG so the per-line cuts are stable across renders/resizes. */
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * One torn-paper strip around a line box. Straight `L` segments meeting at sharp,
 * randomly-offset vertices = angular (never wavy); only a couple of notches per edge
 * so it stays calm. Seeded per line, so every line is cut differently.
 */
function line_path(
	left: number,
	top: number,
	right: number,
	bottom: number,
	amp: number,
	rand: () => number
): string {
	const jitter = () => (rand() * 2 - 1) * amp;
	const pts: Array<[number, number]> = [];
	const notches = () => 2 + Math.floor(rand() * 2); // 2–3 sharp vertices per long edge

	pts.push([left, top + jitter()]);
	const topN = notches();
	for (let i = 1; i <= topN; i++) {
		pts.push([left + ((right - left) * i) / (topN + 1), top + jitter()]);
	}
	pts.push([right, top + jitter()]);
	pts.push([right + Math.abs(jitter()) * 0.7, (top + bottom) / 2]);
	pts.push([right, bottom + jitter()]);
	const botN = notches();
	for (let i = 1; i <= botN; i++) {
		pts.push([right - ((right - left) * i) / (botN + 1), bottom + jitter()]);
	}
	pts.push([left, bottom + jitter()]);
	pts.push([left - Math.abs(jitter()) * 0.7, (top + bottom) / 2]);

	return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
}

export const torn_highlight: Action<HTMLElement, TornParams> = (node, params) => {
	const text_el = node.querySelector<HTMLElement>('.collage-text');
	let svg: SVGSVGElement | null = null;
	let current = params;
	let frame = 0;

	function build() {
		if (!text_el) return;

		// Measure in the un-rotated layout space, then re-apply the tilt to the whole
		// wrapper so the SVG + text rotate together. No paint happens between, so the
		// transform toggle is invisible.
		node.style.transform = 'none';
		const wrap = node.getBoundingClientRect();
		const font_size = parseFloat(getComputedStyle(text_el).fontSize) || 16;
		const pad_x = font_size * 0.4;
		const pad_y = font_size * 0.22;
		const amp = font_size * 0.07;

		const range = document.createRange();
		range.selectNodeContents(text_el);
		const lines = new Map<number, DOMRect>();
		for (const rect of range.getClientRects()) {
			if (rect.width < 1) continue;
			const key = Math.round(rect.top);
			if (!lines.has(key)) lines.set(key, rect);
		}

		svg?.remove();
		svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('class', 'collage-bg');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('width', String(node.clientWidth));
		svg.setAttribute('height', String(node.clientHeight));

		const seed = string_hash(current.text);
		let i = 0;
		for (const rect of lines.values()) {
			const rand = mulberry32(seed + i * 9176 + 13);
			const d = line_path(
				rect.left - wrap.left - pad_x,
				rect.top - wrap.top - pad_y,
				rect.right - wrap.left + pad_x,
				rect.bottom - wrap.top + pad_y,
				amp,
				rand
			);
			const path = document.createElementNS(SVG_NS, 'path');
			path.setAttribute('d', d);
			svg.appendChild(path);
			i++;
		}

		node.prepend(svg);
		node.classList.add('has-collage');
		node.style.transform = `rotate(${current.tilt})`;
	}

	function schedule() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(build);
	}

	schedule();
	const ro = new ResizeObserver(schedule);
	if (node.parentElement) ro.observe(node.parentElement);

	return {
		update(next: TornParams) {
			current = next;
			schedule();
		},
		destroy() {
			cancelAnimationFrame(frame);
			ro.disconnect();
			svg?.remove();
		}
	};
};
