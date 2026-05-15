<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string
	} from '$lib/admin/admin_filters';
	import { list_videos } from './admin_videos.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const FILTER_KEYS = ['q', 'status'] as const;
	const PAGE_SIZE = 25;

	type VideoStatusFilter = (typeof STATUS_FILTERS)[number];

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist<VideoStatusFilter>(
			current_page.url.searchParams,
			'status',
			STATUS_FILTERS,
			'ALL'
		)
	);
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_video_ids = $state<string[]>([]);

	function get_list_videos_query() {
		return list_videos({
			search_text,
			status: status_filter,
			page: page_number,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_videos_query());

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function on_search_input(next_value: string) {
		update_url({ q: next_value || null, page: null });
	}

	function on_status_select(next_value: string) {
		update_url({ status: next_value || null, page: null });
	}

	function on_page_change(next_page: number) {
		update_url({ page: next_page > 1 ? next_page : null });
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Videos</h1>
		<AdminActions>
			<a class="button small" href="/admin/content/videos/import">Import New Videos</a>
		</AdminActions>
	</div>

	{#await list_result_promise}
		<p class="fs-2">Loading videos...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			bind:selected_ids={selected_video_ids}
			{visible_ids}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch text={search_text} on_input={on_search_input} />
					<div
						class="flex"
						style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
					>
						<SelectMenu
							popover_id="filter-status"
							button_text={`Status ${status_filter !== 'ALL' ? `(${status_filter})` : ''}`}
							button_icon={'filter' as any}
							value={status_filter === 'ALL' ? '' : status_filter}
							options={STATUS_FILTER_OPTIONS}
							onselect={on_status_select}
						/>
						{#if show_clear_filters}
							<a class="button small" href="/admin/content/videos">× Clear</a>
						{/if}
					</div>
				</div>
			{/snippet}

			{#snippet table_head()}
				<th>Title</th>
				<th>Status</th>
				<th>Published</th>
				<th>YouTube</th>
			{/snippet}

			{#snippet table_body()}
				{#each list_items as video_row (video_row.id)}
					{@const has_content = video_row.meta !== null && video_row.meta !== undefined}
					{@const display_title = video_row.meta?.title ?? video_row.title}
					<tr>
						<td>
							<div class="stack" style:--stack-gap="var(--pad-xsmall)">
								<p>{display_title}</p>
								{#if has_content}
									<a href={`/admin/content/videos/${video_row.meta?.id}`}>Edit</a>
								{/if}
							</div>
						</td>
						<td>{video_row.meta?.status ?? '-'}</td>
						<td>
							{#if video_row.published_at}
								{format(video_row.published_at, 'MMM d, yyyy HH:mm')}
							{:else}
								-
							{/if}
						</td>
						<td>
							<a href={video_row.url} target="_blank" rel="noopener noreferrer">↗</a>
						</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="4">No matching videos found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load videos. Please try again.</p>
	{/await}
</div>
