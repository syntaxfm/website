<script lang="ts">
	import Toggle from '$lib/forms/Toggle.svelte';
	import ShowEpisodes from '$lib/shows/ShowEpisodes.svelte';
	import { count_podcasts, get_all_podcasts } from '$server/shows/shows.remote';
	import { page } from '$app/state';
	import { PER_PAGE } from '$const';
	import Pagination from '$lib/layout/Pagination.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import Meta from '$lib/meta/Meta.svelte';

	// let count = await count_podcasts();
	let params = $derived(page.url.searchParams);
	let view: 'list' | 'grid' = $state('grid');

	// We tell google to ignore filters, BUT not ?page=2...Infinity
	let isNoindexPage = $derived(
		['order', 'type', 'sort', 'perPage'].some((filter) => page.url.searchParams.has(filter))
	);
	let page_number = $derived(parseInt(params.get('page') || '1'));

	$effect(() => {
		page.url.searchParams;
		get_all_podcasts().refresh();
	});
</script>

<Meta
	title={`Syntax Podcast Shows ${page_number > 1 ? `- Page ${page_number}` : ''}`}
	canonical={`${page.url.protocol}//${page.url.host}${page.url.pathname}${page_number > 1 ? `?page=${page_number}` : ''}`}
></Meta>

<svelte:head>
	{#if isNoindexPage}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section class="stack">
	<div class="stack">
		<h1 class="h3">The Syntax Podcast</h1>
		<p>
			hosted by Scott Tolinski and Wes Bos, is your go-to resource for all things web development.
			Covering everything from cutting-edge frameworks to career tips, Scott and Wes bring their
			expertise, humor, and fresh perspectives to every episode. Whether you're a seasoned developer
			or just starting out, Syntax has something for you!
		</p>

		<div class="split">
			<div class="flex">
				<!-- Since we're moving on from this type of episode branding, should we keep this? -->
				<!-- <SelectMenu
				popover_id="filter-type"
				onselect={(e) => {
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
			/> -->
				<SelectMenu
					popover_id="filter-perPage"
					value_as_label
					button_text="Per Page"
					value={params.get('perPage')?.toString() || '29'}
					options={[
						{ value: '29', label: '29' },
						{ value: '49', label: '49' },
						{ value: '69', label: '69' }
					]}
				/>
				<!-- <SelectMenu
				popover_id="filter-order"
				onselect={(e) => {
					params.set('order', e.detail);
				}}
				value={params.get('order') || 'desc'}
				button_text="Sort"
				button_icon="sort"
				options={[
					{ value: 'desc', label: 'Newest To Oldest' },
					{ value: 'asc', label: 'Oldest To Newest' }
				]}
			/> -->
				<!-- <a class="button" href="/guests">Guests →</a> -->
			</div>
			<Toggle
				onchange={(s) => (view = s ? 'grid' : 'list')}
				on_icon="grid"
				off_icon="list"
				checked={view === 'grid'}
			/>
		</div>
	</div>

	<ShowEpisodes type={view} shows={await get_all_podcasts()} />

	<Pagination
		page={parseInt(params.get('page') || '1')}
		count={(await count_podcasts()) || 69}
		perPage={parseInt(params.get('perPage') || '') || PER_PAGE}
	/>
</section>
