<script lang="ts">
	import type { LatestShow } from '$/server/ai/queries';
	import ShowOg from './ShowOg.svelte';

	let { data } = $props();
	let { show } = $derived(data);
	// This sucks but the type error made no sense.
	// Was using the exact query to generate the type
	let show_casted = $derived(show as LatestShow);
</script>

{#if show}
	<div class="og-container">
		<ShowOg show={show_casted} />
	</div>
{/if}

<style lang="postcss">
	.og-container {
		aspect-ratio: 1200 / 630;
		overflow: hidden;
		box-shadow: inset 0 0 0 10px var(--yellow);
	}
</style>
