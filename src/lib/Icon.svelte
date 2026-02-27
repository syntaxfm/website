<script lang="ts" module>
	export const icon_names = [
		'apple-podcasts',
		'arrow-right',
		'bluesky',
		'close',
		'code',
		'discord',
		'down',
		'download',
		'edit',
		'facebook',
		'filter',
		'forwards',
		'github',
		'grid',
		'instagram',
		'link',
		'link-out',
		'linkedin',
		'list',
		'monitor',
		'pause',
		'play',
		'rewind',
		'search',
		'send',
		'share',
		'sort',
		'spotify',
		'threads',
		'thumbtack',
		'tiktok',
		'twitter',
		'volume-off',
		'volume-up',
		'youtube'
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

	const capitalized_name = $derived(capitalize(name));
	let has_initialized_title = false;
	$effect(() => {
		if (has_initialized_title) return;
		if (!title) title = capitalized_name;
		has_initialized_title = true;
	});
</script>

<svg
	class="icon"
	style="height: {height}px; width: {width}px; stroke-width: {weight}px;"
	aria-hidden={aria_hidden}
>
	<use href={`/__spritemap#icon-${name}`} />
</svg>
