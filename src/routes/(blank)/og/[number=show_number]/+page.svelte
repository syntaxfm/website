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
		aspect-ratio: 20 / 10;
		outline: 1px solid white;
	}
</style>
