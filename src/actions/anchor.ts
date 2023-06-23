import type { Action } from 'svelte/action';

export const anchor: Action<HTMLElement, string> = (node: HTMLElement, id: string) => {
	function updatePosition() {
		const anchor_position = node.getBoundingClientRect();
		const target = document.getElementById(id);
		if (target) {
			target.style.inset = 'unset';
			target.style.left = anchor_position.left + 'px';
			target.style.top = anchor_position.bottom + 'px';
		}
	}

	// Use the ResizeObserver to watch for changes in size of 'node'
	const resizeObserver = new ResizeObserver(updatePosition);
	resizeObserver.observe(node);
	window.addEventListener('resize', updatePosition);
	return {
		destroy() {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updatePosition);
		}
	};
};
