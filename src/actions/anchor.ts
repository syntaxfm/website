// * A Svelte Action for using the new html popover API
// The new popover api works great with a polyfill but anchoring is still a shit show.
// We need anchoring because there is no relative container positioning of popovers
// So if you are using a popover, use:anchor will help you anchor your popover

import type { Action } from 'svelte/action';

type Position = ['TOP' | 'BOTTOM', 'LEFT' | 'RIGHT'];

export const anchor: Action<HTMLElement, { id: string; position: Position }> = (
	node: HTMLElement,
	{ id, position = ['BOTTOM', 'LEFT'] }: { id: string; position: Position }
) => {
	const vert = position[0];
	const horizontal = position[1];
	function updatePosition() {
		const anchor_position = node.getBoundingClientRect();
		const target = document.getElementById(id);

		if (target) {
			target.style.opacity = '0';

			const target_position = target?.getBoundingClientRect();
			target.style.inset = 'unset';
			if (vert === 'BOTTOM') {
				target.style.top = anchor_position.bottom - target_position.height + 'px';
			} else {
				target.style.top = anchor_position.top + 'px';
			}
			if (horizontal === 'LEFT') {
				target.style.left = anchor_position.left + 'px';
			} else {
				target.style.left = anchor_position.right - target_position.width + 'px';
			}
			target.style.opacity = '1';
		}
	}

	// The anchor moves when the page or a sideways-scrolling row scrolls, so place the
	// popover again each time it opens
	function update_on_open(event: Event) {
		if (event instanceof ToggleEvent && event.newState === 'open') updatePosition();
	}
	const target = document.getElementById(id);
	target?.addEventListener('beforetoggle', update_on_open);

	// Use the ResizeObserver to watch for changes in size of 'node'
	const resize_observer = new ResizeObserver(updatePosition);
	resize_observer.observe(node);
	window.addEventListener('resize', updatePosition);
	return {
		destroy() {
			target?.removeEventListener('beforetoggle', update_on_open);
			resize_observer.disconnect();
			window.removeEventListener('resize', updatePosition);
		}
	};
};
