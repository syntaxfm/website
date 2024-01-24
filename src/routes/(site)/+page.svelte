<script lang="ts">
	import PodcastHero from '$lib/PodcastHero.svelte';
	import ShowCard from '$lib/ShowCard.svelte';

	export let data;
	$: ({ latest } = data);
	type Show = (typeof latest)[0];
	let last_ten: Show[];
	let latest_show: Show | null = null;

	$: {
		[latest_show, ...last_ten] = latest;
	}
</script>

<h1 class="visually-hidden">Syntax Podcast</h1>
<PodcastHero />

<section aria-label="Latest podcast episodes full layout">
	<h3 class="lines">Latest Episodes</h3>
	<div class="grid" style:margin-bottom="2rem">
		{#if latest_show}
			<ShowCard display="highlight" show={latest_show} />
		{/if}
		{#each last_ten as latest_ep}
			<ShowCard show={latest_ep} />
		{/each}
		<div class="grid-center" style="grid-column: 1 / -1;">
			<a href="/shows" class="button">See all shows</a>
		</div>
	</div>
</section>

<style>
	section {
		margin-top: 5rem;
	}
</style>
