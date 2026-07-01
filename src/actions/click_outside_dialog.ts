import type { Action } from 'svelte/action';

interface Attributes {
	'on:click-outside'?: (event: CustomEvent) => void;
}

export const click_out_dialog: Action<HTMLElement, void, Attributes> = (node: HTMLElement) => {
	const handle_click = (event: MouseEvent) => {
		if (event.target === event.currentTarget) {
			node.dispatchEvent(
				new CustomEvent('click-outside', { detail: 'Detects a click outside of an element.' })
			);
		}
	};

	node.addEventListener('click', handle_click, true);

	return {
		destroy() {
			node.removeEventListener('click', handle_click, true);
		}
	};
};
