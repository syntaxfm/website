import type { Action } from 'svelte/action';

interface Attributes {
	'on:click-outside'?: (event: CustomEvent) => void;
}

export const clickOutDialog: Action<HTMLElement, any, Attributes> = (node: HTMLElement) => {
	const handleClick = (event: MouseEvent) => {
		if (event.target === event.currentTarget) {
			node.dispatchEvent(
				new CustomEvent('click-outside', { detail: 'Detects a click outside of an element.' })
			);
		}
	};

	node.addEventListener('click', handleClick, true);

	return {
		destroy() {
			node.removeEventListener('click', handleClick, true);
		}
	};
};
