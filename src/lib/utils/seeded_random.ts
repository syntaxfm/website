/**
 * Seeded randomness: the same seed string always gives the same stream, so anything
 * generated from it renders the same on the server and after hydration.
 */

/** Deterministic PRNG (mulberry32): same seed, same stream. */
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function string_seed(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
	return Math.abs(hash) || 1;
}

export interface Rng {
	(): number;
	range(min: number, max: number): number;
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
}

export function make_rng(seed: number): Rng {
	const next = mulberry32(seed);
	const rng = (() => next()) as Rng;
	rng.range = (min, max) => min + next() * (max - min);
	rng.int = (min, max) => Math.floor(min + next() * (max - min + 1));
	rng.pick = (items) => items[Math.floor(next() * items.length)];
	return rng;
}
