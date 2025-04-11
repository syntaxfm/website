<script lang="ts">
	import Icon, { type IconName, icon_names } from '$lib/Icon.svelte';

	interface Props {
		name: IconName;
	}

	let { name }: Props = $props();
</script>

{#each icon_names as icon_name}
	<Icon name={icon_name} />
{/each}
