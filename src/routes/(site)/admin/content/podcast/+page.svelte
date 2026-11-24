<script lang="ts">
	import { PODCAST_TABS } from '#lib/admin/admin_tabs.ts';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminDateRange from '#lib/admin/AdminDateRange.svelte';
	import AdminFilterMenu from '#lib/admin/AdminFilterMenu.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminPageHeader from '#lib/admin/AdminPageHeader.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
	import RemoteFormButton from '#lib/forms/RemoteFormButton.svelte';
	import { humanize_enum } from '#lib/utils/format_enum.ts';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string,
		to_filter_options
	} from '#lib/admin/admin_filters.ts';
	import {
		bulk_update_show_status,
		import_all_shows,
		list_shows,
		refresh_all
	} from './admin_podcast.remote';

	const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const FILTER_KEYS = ['q', 'status', 'date_from', 'date_to'] as const;
	const PAGE_SIZE = 25;

	const STATUS_FILTER_OPTIONS = to_filter_options(STATUSES, { include_all: true });
	const BULK_STATUS_OPTIONS = to_filter_options(STATUSES);

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist(current_page.url.searchParams, 'status', ['', ...STATUSES] as const, '')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_ids = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	// The list's query, also used to refresh it after a bulk action
	let list_query = $derived<Parameters<typeof list_shows>[0]>({
		search_text,
		status: status_filter || 'ALL',
		date_from_iso: date_from || undefined,
		date_to_iso: date_to || undefined,
		page: page_number,
		page_size: PAGE_SIZE
	});

	let list_result = $derived(await list_shows(list_query));

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replace: true,
			reset: false
		});
	}

	async function run_bulk_status_update(value: string) {
		const status = STATUSES.find((known_status) => known_status === value);
		if (!status) return;

		action_message = '';
		action_error = '';
		busy = true;

		try {
			const show_numbers = selected_ids
				.map((id) => Number.parseInt(id, 10))
				.filter((show_number) => Number.isFinite(show_number));
			const result = await bulk_update_show_status({ show_numbers, status });

			const skipped_suffix =
				result.skipped_count > 0 ? ` Skipped ${result.skipped_count} unlinked show(s).` : '';

			action_message = `Set ${result.count} show(s) to ${humanize_enum(status)}.${skipped_suffix}`;
			selected_ids = [];
			await list_shows(list_query).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to update status. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Shows | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<AdminPageHeader title="Podcast" tabs={PODCAST_TABS}>
		{#snippet actions()}
			<form action="/webhooks/refresh" method="GET">
				<button type="submit" data-intent="quiet">Refresh webhook</button>
			</form>
			<RemoteFormButton data-intent="quiet" remote={refresh_all}>Refresh all</RemoteFormButton>
			<RemoteFormButton remote={import_all_shows}>Sync new shows</RemoteFormButton>
			<a class="button" data-intent="primary" href={resolve('admin/content/podcast/new')}
				>New show</a
			>
		{/snippet}
	</AdminPageHeader>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids
		visible_ids={list_result.items.map((item) => String(item.number))}
		{busy}
		message={action_message}
		error={action_error}
		clear_href={show_clear_filters ? resolve('admin/content/podcast') : null}
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
		{/snippet}

		{#snippet bulk()}
			<AdminFilterMenu
				label="Set status"
				options={BULK_STATUS_OPTIONS}
				disabled={busy}
				onselect={run_bulk_status_update}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Number</th>
			<th>Title</th>
			<th>Status</th>
			<th>Date</th>
			<th>Show type</th>
		{/snippet}

		{#snippet table_body({ select_cell })}
			{#each list_result.items as show_row (show_row.number)}
				<tr>
					{@render select_cell(String(show_row.number), show_row.title)}
					<td class="admin-cell-muted">#{show_row.number}</td>
					<AdminTitleCell
						title={show_row.title}
						edit_href={resolve(`admin/content/podcast/${show_row.number}`)}
						public_href={resolve(`show/${show_row.number}/${show_row.slug}`)}
					/>
					<td><StatusBadge status={show_row.meta?.status} /></td>
					<AdminDateCell value={show_row.date} />
					<td class="admin-cell-muted">{humanize_enum(show_row.show_type)}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="6">No matching shows found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
