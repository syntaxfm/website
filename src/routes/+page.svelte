<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import PodcastHero from '$lib/PodcastHero.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';

	export let data;
	$: ({ latest } = data);
	type Show = (typeof latest)[0];
	let last_ten: Show[];
	let latest_show: Show | null = null;

	$: {
		[latest_show, ...last_ten] = latest;
	}
</script>

<PodcastHero />

<section aria-label="Latest podcast episodes">
	<h2 class="h3 lines">Latest Episodes</h2>
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

<div class="zone layout full" style:--bg="var(--black)" style:--fg="var(--white)">
	<NewsletterForm />
</div>

<style>
	section {
		margin-top: 5rem;
	}
</style>
