<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import ShowCard from '$lib/ShowCard.svelte';
	import { invalidate } from '$app/navigation';

	export let data;

	let loading_more = false;
	let limit = 100;

	$: ({ shows } = data);
	const store = queryParameters();

	$: if (shows) {
		loading_more = false;
	}
</script>

<section>
	<div class="list-heading">
		<h1 class="h3">All Episodes</h1>

		<div style="display:flex; gap: 10px;">
			<SelectMenu
				popover_id="filter-episodes"
				on:select={(e) => {
					$store.filter = e.detail;
				}}
				button_text="Episode Type"
				button_icon="filter"
				value={$store.filter || ''}
				options={[
					{ value: '', label: 'All' },
					{ value: 'hasty', label: 'Hasty' },
					{ value: 'tasty', label: 'Tasty' },
					{ value: 'supper', label: 'Supper Club' },
					{ value: 'special', label: 'Special' }
				]}
			/>
			<SelectMenu
				popover_id="sort-episodes"
				on:select={(e) => {
					$store.order = e.detail;
				}}
				value={$store.order || 'desc'}
				button_text="Sort Episodes"
				button_icon="sort"
				options={[
					{ value: 'desc', label: 'Newest To Oldest' },
					{ value: 'asc', label: 'Oldest To Newest' }
				]}
			/>
		</div>
	</div>
	{#each shows as show (show.id)}
		<ShowCard {show} display="list" />
	{/each}
	<div class="load-more">
		<button
			on:click={() => {
				loading_more = true;
				limit += 50;
				$store.limit = limit + 50;
				invalidate('/shows');
			}}
		>
			{#if loading_more}
				Loading More 🔄
			{:else}
				Load More ➕
			{/if}
		</button>
	</div>
</section>

<style lang="postcss">
	.list-heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-direction: column;
		margin-bottom: 2rem;
		@media (--above_med) {
			flex-direction: row;
		}
	}

	.load-more {
		padding: 2rem 0;
		text-align: center;
	}
</style>
