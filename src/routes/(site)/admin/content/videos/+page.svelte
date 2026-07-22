<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import StatusBadge from '$lib/admin/StatusBadge.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string
	} from '$lib/admin/admin_filters';
	import { list_videos } from './admin_videos.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const FILTER_KEYS = ['q', 'status', 'date_from', 'date_to', 'order'] as const;
	const PAGE_SIZE = 25;

	type VideoStatusFilter = (typeof STATUS_FILTERS)[number];
	type VideoOrder = (typeof ORDER_VALUES)[number];

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const ORDER_OPTIONS = [
		{ value: 'desc', label: 'Newest To Oldest' },
		{ value: 'asc', label: 'Oldest To Newest' }
	];

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist<VideoStatusFilter>(current_page.url.searchParams, 'status', STATUS_FILTERS, 'ALL')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let order = $derived(
		read_picklist<VideoOrder>(current_page.url.searchParams, 'order', ORDER_VALUES, 'desc')
	);
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_video_ids = $state<string[]>([]);

	let list_result = $derived(
		await list_videos({
			search_text,
			status: status_filter,
			date_from_iso: date_from || undefined,
			date_to_iso: date_to || undefined,
			order,
			page: page_number,
			page_size: PAGE_SIZE
		})
	);

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<svelte:head>
	<title>Videos | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-actions">
		<a class="button small" data-intent="primary" href={resolve('/admin/content/videos/import')}
			>Import New Videos</a
		>
	</div>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids={selected_video_ids}
		visible_ids={list_result.items.map((item) => item.id)}
	>
		{#snippet filters()}
			<div class="admin-control-row">
				<AdminSearch
					text={search_text}
					on_input={(value) => update_url({ q: value || null, page: null })}
				/>
				<div class="admin-control-row">
					<label class="admin-field">
						<span class="fs-1">From</span>
						<input
							type="date"
							value={date_from}
							onchange={(event) =>
								update_url({ date_from: event.currentTarget.value || null, page: null })}
						/>
					</label>
					<label class="admin-field">
						<span class="fs-1">To</span>
						<input
							type="date"
							value={date_to}
							onchange={(event) =>
								update_url({ date_to: event.currentTarget.value || null, page: null })}
						/>
					</label>
					<SelectMenu
						popover_id="filter-status"
						button_text={`Status ${status_filter !== 'ALL' ? `(${status_filter})` : ''}`}
						button_icon="filter"
						value={status_filter === 'ALL' ? '' : status_filter}
						options={STATUS_FILTER_OPTIONS}
						onselect={(value) => update_url({ status: value || null, page: null })}
					/>
					<SelectMenu
						popover_id="filter-order"
						button_text="Sort"
						button_icon="sort"
						value={order}
						options={ORDER_OPTIONS}
						onselect={(value) => update_url({ order: value === 'desc' ? null : value, page: null })}
					/>
					{#if show_clear_filters}
						<a class="button small" data-intent="quiet" href={resolve('/admin/content/videos')}
							>× Clear</a
						>
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
			{#each list_result.items as video_row (video_row.id)}
				{@const has_content = video_row.meta !== null && video_row.meta !== undefined}
				{@const display_title = video_row.meta?.title ?? video_row.title}
				<tr>
					<td>
						<div class="admin-row">
							<p>{display_title}</p>
							{#if has_content}
								<a href={resolve(`/admin/content/videos/${video_row.meta?.id}`)}>Edit</a>
							{/if}
						</div>
					</td>
					<td><StatusBadge status={video_row.meta?.status} /></td>
					<td>
						{#if video_row.published_at}
							{format(video_row.published_at, 'MMM d, yyyy HH:mm')}
						{:else}
							-
						{/if}
					</td>
					<td>
						<a href={video_row.url} target="_blank" rel="noopener noreferrer external">YouTube</a>
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
</div>
