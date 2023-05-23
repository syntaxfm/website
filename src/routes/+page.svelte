<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import type { Show } from '@prisma/client';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ latest } = data);
	let last_ten: Show[];
	let latest_show: Show | null = null;

	$: {
		[latest_show, ...last_ten] = latest;
	}
</script>

<h2>Latest Show</h2>
<div class="article-grid">
	{#if latest_show}
		<ShowCard highlight={true} show={latest_show} />
	{/if}
</div>

<h2>Last 10</h2>
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
