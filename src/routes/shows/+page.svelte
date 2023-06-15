<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import ShowCard from '$lib/ShowCard.svelte';
	import type { PageData } from './$types';

	let sort = 'nto';
	export let data: PageData;
	$: ({ shows } = data);
	const store = queryParameters();
</script>

<section>
	<div class="list-heading">
		<h3>All Episodes</h3>

		<div style="">
			<SelectMenu
				on:select={(e) => {
					$store.filter = e.detail;
				}}
				button_text="Episode Type"
				button_icon="filter"
				options={[
					{ value: 'hasty', label: 'Hasty' },
					{ value: 'tasty', label: 'Tasty' },
					{ value: 'supper', label: 'Supper Club' },
					{ value: 'special', label: 'Special' }
				]}
			/>
			<!-- <SelectMenu
				on:select={(e) => {
					$store.order = e.detail;
				}}
				button_text="Sort Episodes"
				button_icon="sort"
				options={[
					{ value: 'desc', label: 'Newest To Oldest' },
					{ value: 'asc', label: 'Oldest To Newest' }
				]}
			/> -->
		</div>
	</div>
	{#each shows as show (show.id)}
		<ShowCard {show} display="list" />
	{/each}
</section>

<style>
	.list-heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	h3 {
		view-transition-name: var(--transition-name);
	}
</style>
