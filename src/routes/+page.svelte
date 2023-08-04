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

<div>
	<h4>Latest Episode</h4>
	<div class="show-grid">
		{#if latest_show}
			<ShowCard display="highlight" show={latest_show} />
		{/if}
	</div>

	<h4>Last 9</h4>
	<div class="show-grid">
		{#each last_ten as latest_ep}
			<ShowCard show={latest_ep} />
		{/each}
	</div>
</div>
