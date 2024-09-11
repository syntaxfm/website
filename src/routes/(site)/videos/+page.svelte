<script lang="ts">
	import PlaylistCard from '$lib/videos/PlaylistCard.svelte';
	import { page } from '$app/stores';

	export let data;
	$: ({ playlists } = data);

	// We tell google to ignore filters, BUT not ?page=2...Infinity
	$: isNoindexPage = ['order', 'type', 'sort', 'perPage'].some((filter) =>
		$page.url.searchParams.has(filter)
	);
</script>

<svelte:head>
	{#if isNoindexPage}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section>
	<div class="list-heading">
		<h1 class="h3">All Playlists</h1>
	</div>

	<!-- Maybe bring back later -->
	<!-- <Pagination
		page={parseInt($store.page || '1')}
		count={data.count || 69}
		perPage={parseInt($store.perPage || PER_PAGE.toString())}
	/> -->

	<div class="playlists">
		{#each playlists as playlist (playlist.id)}
			<PlaylistCard {playlist} />
		{/each}
	</div>

	<!-- <Pagination
		page={parseInt($store.page || '1')}
		count={data.count || 69}
		perPage={parseInt($store.perPage || PER_PAGE.toString())}
	/> -->
</section>

<style lang="postcss">
	section {
		display: grid;
		gap: 20px;
		margin-bottom: 20px;
	}
	.list-heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-direction: column;
		margin-bottom: 2rem;
		@media (--above-med) {
			flex-direction: row;
		}
	}
</style>
