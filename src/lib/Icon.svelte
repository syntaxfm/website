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
	}

	let { name, title = $bindable(''), aria_hidden = true }: Props = $props();
	if (!title && title !== false) title = capitalize(name);
</script>

<img src="/__spritemap#{name}" />
