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
		aspect-ratio: 1200 / 630;
		overflow: hidden;
		outline: 1px solid black;
	}
</style>
