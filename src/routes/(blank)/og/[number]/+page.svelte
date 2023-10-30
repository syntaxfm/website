<script lang="ts">
	import ShowOg from '$lib/ShowOg.svelte';

	export let data;
	$: ({ show } = data);
</script>

<div class="og-container">
	<ShowOg {show} />
</div>

<style lang="postcss">
	.og-container {
		aspect-ratio: 1200 / 600;
		overflow: hidden;
		box-shadow: inset 0 0 0 10px var(--yellow);
	}
</style>
