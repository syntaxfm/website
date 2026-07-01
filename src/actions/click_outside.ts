// * A Svelte Action for firing and event on click outside

import type { Action } from 'svelte/action';
interface Attributes {
	'on:click-outside'?: (event: CustomEvent) => void;
}

export const click_outside: Action<HTMLElement, void, Attributes> = (node: HTMLElement) => {
	const handle_click = (event: MouseEvent) => {
		if (node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented) {
			node.dispatchEvent(
				new CustomEvent('click-outside', { detail: 'Detects a click outside of an element.' })
			);
		}
	};

	document.addEventListener('click', handle_click, true);

	return {
		destroy() {
			document.removeEventListener('click', handle_click, true);
		}
	};
};
