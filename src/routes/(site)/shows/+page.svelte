<script lang="ts">
	import { page } from '$app/stores';
	import { PER_PAGE } from '$const';
	import Pagination from '$lib/Pagination.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import ShowCard from '$lib/ShowCard.svelte';
	import { queryParameters } from 'sveltekit-search-params';

	export let data;

	$: ({ shows } = data);

	const store = queryParameters<{
		type?: string;
		perPage?: string;
		order?: string;
		page: string;
	}>();

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
		<h1 class="h3">All Episodes</h1>
		<div style="display:flex; gap: 10px;">
			<SelectMenu
				popover_id="filter-type"
				on:select={(e) => {
					$store.type = e.detail;
				}}
				button_text="Type"
				button_icon="filter"
				value={$store.type || ''}
				options={[
					{ value: '', label: 'All' },
					{ value: 'hasty', label: 'Hasty' },
					{ value: 'tasty', label: 'Tasty' },
					{ value: 'supper', label: 'Supper Club' },
					{ value: 'special', label: 'Special' }
				]}
			/>
			<SelectMenu
				popover_id="filter-perPage"
				on:select={(e) => {
					$store.perPage = e.detail;
				}}
				value_as_label
				button_text="Per Page"
				value={$store.perPage?.toString() || '10'}
				options={[
					{ value: '10', label: '10' },
					{ value: '20', label: '20' },
					{ value: '40', label: '40' }
				]}
			/>
			<SelectMenu
				popover_id="filter-order"
				on:select={(e) => {
					$store.order = e.detail;
				}}
				value={$store.order || 'desc'}
				button_text="Sort"
				button_icon="sort"
				options={[
					{ value: 'desc', label: 'Newest To Oldest' },
					{ value: 'asc', label: 'Oldest To Newest' }
				]}
			/>
			<a class="button subtle" href="/guests">Guests →</a>
		</div>
	</div>

	<Pagination
		page={parseInt($store.page || '1')}
		count={data.count || 69}
		perPage={parseInt($store.perPage || PER_PAGE.toString())}
	/>

	<div class="shows">
		{#each shows as show (show.id)}
			<ShowCard {show} display="list" heading="h2" />
		{/each}
	</div>

	<Pagination
		page={parseInt($store.page || '1')}
		count={data.count || 69}
		perPage={parseInt($store.perPage || PER_PAGE.toString())}
	/>
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
		@media (--above_med) {
			flex-direction: row;
		}
	}
</style>
