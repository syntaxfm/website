<script lang="ts">
	import Toggle from '#lib/forms/Toggle.svelte';
	import ShowEpisodes from '#lib/shows/ShowEpisodes.svelte';
	import { count_podcasts, get_all_podcasts } from '#lib/shows/shows.remote.ts';
	import { page } from '$app/state';
	import Pagination from '#lib/layout/Pagination.svelte';
	import SelectMenu from '#lib/SelectMenu.svelte';
	import Meta from '#lib/meta/Meta.svelte';

	// The list's default page size (also the Per Page menu's default)
	const DEFAULT_PER_PAGE = 29;

	let params = $derived(page.url.searchParams);
	let view: 'list' | 'grid' = $state('grid');

	// We tell google to ignore filters, BUT not ?page=2...Infinity
	let is_noindex_page = $derived(
		['order', 'type', 'sort', 'perPage'].some((filter) => params.has(filter))
	);
	let page_number = $derived(Math.max(1, parseInt(params.get('page') || '1') || 1));
	let per_page = $derived(
		Math.min(100, Math.max(1, parseInt(params.get('perPage') || '') || DEFAULT_PER_PAGE))
	);
	// The query re-runs whenever these change
	let podcast_filters = $derived({
		page: page_number,
		order: params.get('order') === 'asc' ? ('asc' as const) : ('desc' as const),
		per_page
	});

	type Podcast = Awaited<ReturnType<typeof get_all_podcasts>>[number];

	function to_episode(podcast: Podcast) {
		return {
			...podcast,
			show: 'Syntax Podcast',
			youtube_url: podcast.youtube_url ?? undefined
		};
	}
</script>

<Meta
	title={`Syntax Podcast Shows ${page_number > 1 ? `- Page ${page_number}` : ''}`}
	canonical={`${page.url.protocol}//${page.url.host}${page.url.pathname}${page_number > 1 ? `?page=${page_number}` : ''}`}
/>

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
				value={String(per_page)}
				options={[
					{ value: '29', label: '29' },
					{ value: '49', label: '49' },
					{ value: '69', label: '69' }
				]}
			/>
		</div>
		<Toggle
			onchange={(s) => view = s ? 'grid' : 'list'}
			on_icon="grid"
			off_icon="list"
			checked={view === 'grid'}
		/>
	</div>

	<ShowEpisodes type={view} shows={(await get_all_podcasts(podcast_filters)).map(to_episode)} />

	<Pagination page={page_number} count={await count_podcasts() || 69} {per_page} />
</section>
