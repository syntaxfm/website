<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import { player } from '$state/player';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ latest } = data);
</script>

<h2>Latest Show</h2>
<div class="article-grid">
	<ShowCard highlight={true} show={latest[0]} />
</div>

<h2>Last 10</h2>
<div class="article-grid">
	{#each latest as latest_ep}
		<ShowCard show={latest_ep} />
	{/each}
</div>

<style>
	.article-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 20px;
	}
</style>
