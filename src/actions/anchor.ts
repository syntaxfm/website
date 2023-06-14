import type { Action } from 'svelte/action';

export const anchor: Action<HTMLElement, string> = (node: HTMLElement, id: string) => {
	const anchor_position = node.getBoundingClientRect();
	const target = document.getElementById(id);
	if (target) {
		target.style.left = anchor_position.left + 'px';
		target.style.top = anchor_position.bottom + 'px';
	}
};
