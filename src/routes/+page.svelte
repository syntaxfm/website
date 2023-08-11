<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import PodcastHero from '$lib/PodcastHero.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
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

<h4>Latest Episodes</h4>
<div class="grid">
	{#if latest_show}
		<ShowCard display="highlight" show={latest_show} />
	{/if}
	{#each last_ten as latest_ep}
		<ShowCard show={latest_ep} />
	{/each}
</div>

<div class="zone layout full" style:--bg="var(--black)" style:--color="var(--white)">
	<NewsletterForm />
</div>
