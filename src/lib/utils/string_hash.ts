/**
 * Deterministic 32-bit string hash (djb2). Stable across SSR/hydration, so it can
 * seed procedural-but-fixed visual variation from a string (e.g. an episode title
 * driving a per-episode highlight tilt/cutout) without `Math.random`.
 */
export function string_hash(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) {
		hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}
