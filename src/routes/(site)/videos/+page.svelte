<script lang="ts">
	import { page } from '$app/state';
	import Toggle from '#lib/forms/Toggle.svelte';
	import Pagination from '#lib/layout/Pagination.svelte';
	import SelectMenu from '#lib/SelectMenu.svelte';
	import ShowEpisodes from '#lib/shows/ShowEpisodes.svelte';
	import {
		get_option_label,
		is_filtered_view,
		ORDER_OPTIONS,
		PER_PAGE_OPTIONS,
		read_browse_filters,
		TYPE_OPTIONS
	} from './browse_filters';
	import { count_browse_items, get_browse_items, get_browse_topics } from './videos.remote';

	let params = $derived(page.url.searchParams);
	let view: 'list' | 'grid' = $state('grid');

	// The queries re-run whenever these change
	let filters = $derived(read_browse_filters(params));
	let list_filters = $derived({ type: filters.type, topic: filters.topic, order: filters.order });

	let total = $derived(await count_browse_items(list_filters));
	let topics = $derived(await get_browse_topics());
	let topic_options = $derived([
		{ value: '', label: 'All topics' },
		...topics.map((topic) => ({ value: topic.slug, label: topic.name }))
	]);
	// A topic past the menu's top few still names itself, by its slug
	let topic_label = $derived(
		filters.topic
			? (topics.find((topic) => topic.slug === filters.topic)?.name ?? filters.topic)
			: 'All topics'
	);
	let type_value = $derived(filters.type === 'all' ? '' : filters.type);
	let order_value = $derived(filters.order === 'asc' ? 'asc' : '');
</script>

<svelte:head>
	{#if is_filtered_view(params)}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section class="stack">
	<h1 class="visually-hidden">Syntax episodes and videos</h1>

	<div class="split filters">
		<div class="flex">
			<SelectMenu
				popover_id="filter-type"
				button_text={get_option_label(TYPE_OPTIONS, type_value)}
				value={type_value}
				options={TYPE_OPTIONS}
			/>
			<SelectMenu
				popover_id="filter-topic"
				button_text={topic_label}
				value={filters.topic ?? ''}
				options={topic_options}
			/>
			<SelectMenu
				popover_id="filter-order"
				button_text={get_option_label(ORDER_OPTIONS, order_value)}
				value={order_value}
				options={ORDER_OPTIONS}
			/>
			<SelectMenu
				popover_id="filter-perPage"
				value_as_label
				button_text="Per Page"
				value={String(filters.per_page)}
				options={PER_PAGE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
			/>
		</div>
		<Toggle
			onchange={(is_grid) => (view = is_grid ? 'grid' : 'list')}
			on_icon="grid"
			off_icon="list"
			checked={view === 'grid'}
		/>
	</div>

	{#if total > 0}
		<ShowEpisodes
			type={view}
			shows={await get_browse_items({
				...list_filters,
				page: filters.page,
				per_page: filters.per_page
			})}
		/>

		<Pagination page={filters.page} count={total} per_page={filters.per_page} />
	{:else}
		<p>Nothing matches these filters yet.</p>
	{/if}
</section>

<style>
	/* Four menus and the view toggle don't fit a phone: the menus scroll sideways, the
	   cut-off pill at the edge shows there are more */
	.filters .flex {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
</style>
