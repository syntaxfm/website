<script lang="ts" module>
	export const icon_names = [
		'close',
		'down',
		'share',
		'link-out',
		'rewind',
		'forwards',
		'volume-off',
		'volume-up',
		'pause',
		'play',
		'search',
		'list',
		'grid',
		'send',
		'download',
		'bluesky',
		'discord',
		'github',
		'twitter',
		'instagram',
		'linkedin',
		'tiktok',
		'threads'
	] as const;
	export type IconName = typeof icon_names;
</script>

<script lang="ts">
	import { capitalize } from '$utilities/capitalize';

	interface Props {
		name: IconName[number];
		title?: string;
		aria_hidden?: boolean;
		height?: number;
		width?: number;
		weight?: number;
	}

	let {
		name,
		title = $bindable(''),
		aria_hidden = true,
		height = 16,
		width = 16,
		weight = 2
	}: Props = $props();
	if (!title) title = capitalize(name);
</script>

<svg
	class="icon"
	style="height: {height}px; width: {width}px; stroke-width: {weight}px;"
	aria-hidden={aria_hidden}
>
	<use href="#icon-{name}" />
</svg>
