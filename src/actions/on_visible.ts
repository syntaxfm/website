import type { Attachment } from 'svelte/attachments';

// Calls `callback` when the element comes within `root_margin` of the viewport. Re-create the
// element (e.g. with {#key}) to check again after the content around it changes.
export function on_visible(callback: () => void, root_margin = '1000px'): Attachment<HTMLElement> {
	return (node) => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) callback();
			},
			{ rootMargin: root_margin }
		);
		observer.observe(node);
		return () => observer.disconnect();
	};
}
