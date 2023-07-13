<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import ShowCard from '$lib/ShowCard.svelte';

	export let data;
	$: ({ shows } = data);
	const store = queryParameters();
</script>

<section>
	<div class="list-heading">
		<h3>All Episodes</h3>

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
		<button>Load More ➕</button>
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

	h3 {
		view-transition-name: var(--transition-name);
	}

	.load-more {
		text-align: center;
	}
</style>
