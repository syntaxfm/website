<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import PodcastHero from '$lib/PodcastHero.svelte';

	import type { Show } from '@prisma/client';

	export let data;
	$: ({ latest } = data);
	let last_ten: Show[];
	let latest_show: Show | null = null;

	$: {
		[latest_show, ...last_ten] = latest;
	}
</script>

<PodcastHero />

<h4>Latest Episode</h4>
<div class="article-grid">
	{#if latest_show}
		<ShowCard display="highlight" show={latest_show} />
	{/if}
</div>

<h4>Last 10</h4>
<div class="article-grid">
	{#each last_ten as latest_ep}
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
