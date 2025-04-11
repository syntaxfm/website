<script lang="ts" module>
	export const icon_names = ['mail-send', 'list', 'grid'] as const;
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

<svg style="height: {height}px; width: {width}px;" alt={title} aria-hidden={aria_hidden}>
	<use xlink:href="/__spritemap#{name}"></use>
</svg>
