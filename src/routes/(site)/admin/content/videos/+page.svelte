<script lang="ts">
	import format_time from '$utilities/format_time';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminDateRange from '#lib/admin/AdminDateRange.svelte';
	import AdminFilterMenu from '#lib/admin/AdminFilterMenu.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string,
		to_filter_options
	} from '#lib/admin/admin_filters.ts';
	import { get_youtube_status, list_videos } from './admin_videos.remote';

	const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const FILTER_KEYS = ['q', 'status', 'date_from', 'date_to', 'order'] as const;
	const PAGE_SIZE = 25;

	const STATUS_FILTER_OPTIONS = to_filter_options(STATUSES, { include_all: true });
	const ORDER_OPTIONS = [
		{ value: 'desc', label: 'Newest first' },
		{ value: 'asc', label: 'Oldest first' }
	];

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist(current_page.url.searchParams, 'status', ['', ...STATUSES] as const, '')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let order = $derived(read_picklist(current_page.url.searchParams, 'order', ORDER_VALUES, 'desc'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let youtube = $derived(await get_youtube_status());
	// Set by /admin/youtube/callback after Connect YouTube
	let connect_result = $derived(current_page.url.searchParams.get('youtube'));

	let list_result = $derived(
		await list_videos({
			search_text,
			status: status_filter || 'ALL',
			date_from_iso: date_from || undefined,
			date_to_iso: date_to || undefined,
			order,
			page: page_number,
			page_size: PAGE_SIZE
		})
	);

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replace: true,
			reset: false
		});
	}
</script>

<svelte:head>
	<title>Videos | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-control-row">
		{#if youtube.connection.status === 'connected'}
			<p class="fs-2">
				YouTube: {youtube.connection.account_name ?? 'connected'} · captions for {youtube.with_captions.toLocaleString()}
				of {youtube.videos.toLocaleString()} videos
			</p>
			<a
				class="button small"
				data-intent="quiet"
				href="/admin/youtube/connect"
				data-sveltekit-reload>Reconnect YouTube</a
			>
		{:else}
			{#if youtube.connection.status === 'failed'}
				<p class="admin-feedback" data-tone="negative" role="status">
					YouTube disconnected: {youtube.connection.failure}
				</p>
			{/if}
			<a
				class="button small"
				data-intent="primary"
				href="/admin/youtube/connect"
				data-sveltekit-reload>Connect YouTube</a
			>
		{/if}
		{#if connect_result === 'connected'}
			<p class="admin-feedback" data-tone="positive" role="status">YouTube connected</p>
		{:else if connect_result === 'cancelled'}
			<p class="admin-feedback" data-tone="negative" role="status">Sign-in cancelled</p>
		{:else if connect_result}
			<p class="admin-feedback" data-tone="negative" role="alert">{connect_result}</p>
		{/if}
	</div>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		visible_ids={list_result.items.map((item) => item.content_id)}
		clear_href={show_clear_filters ? resolve('admin/content/videos') : null}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => update_url({ q: value || null, page: null })}
			/>
			<AdminDateRange
				from={date_from}
				to={date_to}
				onchange={(key, value) => update_url({ [key]: value || null, page: null })}
			/>
			<AdminFilterMenu
				label="Status"
				value={status_filter}
				options={STATUS_FILTER_OPTIONS}
				onselect={(value) => update_url({ status: value || null, page: null })}
			/>
			<AdminFilterMenu
				label="Sort"
				value={order}
				options={ORDER_OPTIONS}
				onselect={(value) => update_url({ order: value === 'desc' ? null : value, page: null })}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Video</th>
			<th>Status</th>
			<th>Published</th>
			<th>Length</th>
			<th>Views</th>
			<th>Captions</th>
		{/snippet}

		{#snippet table_body()}
			{#each list_result.items as video_row (video_row.content_id)}
				<tr>
					<AdminTitleCell
						title={video_row.title}
						image={`https://i.ytimg.com/vi/${video_row.youtube_id}/mqdefault.jpg`}
						edit_href={resolve(`admin/content/videos/${video_row.content_id}`)}
						public_href={video_row.status === 'PUBLISHED'
							? resolve(`videos/${video_row.slug}`)
							: `https://www.youtube.com/watch?v=${video_row.youtube_id}`}
					/>
					<td><StatusBadge status={video_row.status} /></td>
					<AdminDateCell value={video_row.published_at} />
					<td class="admin-cell-muted">
						{video_row.duration_seconds ? format_time(video_row.duration_seconds) : '-'}
					</td>
					<td class="admin-cell-muted">{video_row.view_count?.toLocaleString() ?? '-'}</td>
					<td class="admin-cell-muted">{video_row.has_transcript ? '✓' : '-'}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="6">No matching videos found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
