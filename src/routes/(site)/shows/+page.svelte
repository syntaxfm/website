<script lang="ts">
	import Toggle from '$lib/forms/Toggle.svelte';
	import ShowEpisodes from '$lib/shows/ShowEpisodes.svelte';
	import { count_podcasts, get_all_podcasts } from '$server/shows/shows.remote';
	import { page } from '$app/state';
	import { PER_PAGE } from '$const';
	import Pagination from '$lib/layout/Pagination.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import Meta from '$lib/meta/Meta.svelte';

	let params = $derived(page.url.searchParams);
	let view: 'list' | 'grid' = $state('grid');

	// We tell google to ignore filters, BUT not ?page=2...Infinity
	let is_noindex_page = $derived(
		['order', 'type', 'sort', 'perPage'].some((filter) => params.has(filter))
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
	{#if is_noindex_page}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section class="stack">
	<h1 class="visually-hidden">Syntax Podcast Episodes</h1>

	<div class="split">
		<div class="flex">
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
		</div>
		<Toggle
			onchange={(s) => (view = s ? 'grid' : 'list')}
			on_icon="grid"
			off_icon="list"
			checked={view === 'grid'}
		/>
	</div>

	<ShowEpisodes type={view} shows={await get_all_podcasts()} />

	<Pagination
		page={parseInt(params.get('page') || '1')}
		count={(await count_podcasts()) || 69}
		per_page={parseInt(params.get('perPage') || '') || PER_PAGE}
	/>
</section>
