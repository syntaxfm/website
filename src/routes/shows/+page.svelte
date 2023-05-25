<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ shows } = data);
</script>

<section>
	{#each shows as show (show.id)}
		<ShowCard {show} />
	{/each}
</section>

<style>
	h3 {
		view-transition-name: var(--transition-name);
	}
</style>
