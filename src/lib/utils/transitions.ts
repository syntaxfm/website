import { slide } from 'svelte/transition';
import type { SlideParams, TransitionConfig } from 'svelte/transition';

/**
 * `slide`, but also tweens opacity from 0 → 1 so the element fades in as it expands.
 */
export function slide_fade(node: Element, params?: SlideParams): TransitionConfig {
	const slide_transition = slide(node, params);
	return {
		...slide_transition,
		css: (t, u) => `opacity: ${t}; ${slide_transition.css?.(t, u) ?? ''}`
	};
}
