<script lang="ts" module>
	export const icon_names = ['mail-send'] as const;
	export type IconName = (typeof icon_names)[number];
</script>

<script lang="ts">
	import { capitalize } from '$utilities/capitalize';

	interface Props {
		name: IconName;
		title?: string | boolean;
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
	if (!title && title !== false) title = capitalize(name);
</script>

<img
	src="/__spritemap#{name}"
	style="height: {height}px; width: {width}px;"
	alt={title || name}
	aria-hidden={aria_hidden}
/>
