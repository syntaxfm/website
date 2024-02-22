import { tick } from 'svelte';

export function variable_color_svg() {
	tick();
	const variable_color_svgs = document.querySelectorAll<HTMLElement>('.variable-color-svg');
	// Iterate over nodelist
	variable_color_svgs.forEach((node) => {
		replace_color(node);
	});
}
export function replace_color(node: HTMLElement) {
	const style = getComputedStyle(node);
	const bg = style.getPropertyValue('background-image');
	const primary = style.getPropertyValue('--primary');
	const newBg = bg.replaceAll(/fill\s*=\s*['"].*?['"]/gi, `fill='${encodeURIComponent(primary)}'`);
	node.style.backgroundImage = newBg;
}
