<script lang="ts" module>
	export const icon_names = [
		'mail-send',
		'list',
		'grid',
		'twitter',
		'spotify',
		'applepod',
		'calendar',
		'link',
		'mute',
		'tshirt',
		'youtube',
		'instagram',
		'discord',
		'github',
		'tiktok'
	] as const;
	export type IconName = (typeof icon_names)[number];
</script>

<script lang="ts">
	import { capitalize } from '$utilities/capitalize';

	interface Props {
		name: IconName;
		title?: string;
		aria_hidden?: boolean;
		height?: number;
		width?: number;
	}

	let {
		name,
		title = $bindable(''),
		aria_hidden = true,
		height = 16,
		width = 16
	}: Props = $props();
	if (!title) title = capitalize(name);
</script>

<svg style="height: {height}px; width: {width}px;" aria-hidden={aria_hidden}>
	<use xlink:href="/__spritemap#{name}"></use>
</svg>
