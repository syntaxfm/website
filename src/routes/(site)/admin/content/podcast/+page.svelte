<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import StatusBadge from '$lib/admin/StatusBadge.svelte';
	import RemoteFormButton from '$lib/forms/RemoteFormButton.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string
	} from '$lib/admin/admin_filters';
	import {
		bulk_update_show_status,
		import_all_shows,
		list_shows,
		refresh_all
	} from './admin_podcast.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const BULK_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const FILTER_KEYS = ['q', 'status', 'date_from', 'date_to'] as const;
	const PAGE_SIZE = 25;

	type ShowStatusFilter = (typeof STATUS_FILTERS)[number];
	type ShowStatus = (typeof BULK_STATUSES)[number];

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const BULK_STATUS_OPTIONS = BULK_STATUSES.map((value) => ({ value, label: value }));

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist<ShowStatusFilter>(
			current_page.url.searchParams,
			'status',
			STATUS_FILTERS,
			'ALL'
		)
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let bulk_status = $derived(
		read_picklist<ShowStatus>(
			current_page.url.searchParams,
			'bulk_status',
			BULK_STATUSES,
			'DRAFT'
		)
	);
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_ids = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	type ShowListResult = Awaited<ReturnType<typeof list_shows>>;
	type ShowListItem = ShowListResult['items'][number];

	const list_result = await list_shows({
		search_text,
		status: status_filter,
		date_from_iso: date_from || undefined,
		date_to_iso: date_to || undefined,
		page: page_number,
		page_size: PAGE_SIZE
	});

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	async function run_bulk_status_update() {
		if (selected_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		clear_feedback();
		busy = true;

		try {
			const show_numbers = selected_ids
				.map((id) => Number.parseInt(id, 10))
				.filter((value) => Number.isFinite(value));

			const result = await bulk_update_show_status({
				show_numbers,
				status: bulk_status
			});

			const skipped_suffix =
				result.skipped_count > 0 ? ` Skipped ${result.skipped_count} unlinked show(s).` : '';
			action_message = `Updated ${result.count} show(s) to ${bulk_status}.${skipped_suffix}`;
			selected_ids = [];
			await list_shows({
				search_text,
				status: status_filter,
				date_from_iso: date_from || undefined,
				date_to_iso: date_to || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to update status. Please try again.';
		} finally {
			busy = false;
		}
	}

	function to_show_type_label(show_row: ShowListItem): string {
		switch (show_row.show_type) {
			case 'HASTY':
				return 'Hasty';
			case 'TASTY':
				return 'Tasty';
			case 'SUPPER':
				return 'Supper Club';
			case 'SPECIAL':
				return 'Special';
			default:
				return show_row.show_type;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Shows</h1>
		<AdminActions>
			<a class="button small" href="/admin/content/podcast/new">New Show</a>
			<RemoteFormButton class="small" remote={import_all_shows}
				>Sync Changed/New Shows</RemoteFormButton
			>
			<RemoteFormButton class="small" remote={refresh_all}>Refresh All Shows</RemoteFormButton>
			<form action="/webhooks/refresh" method="GET">
				<button class="small" type="submit">Refresh Webhook</button>
			</form>
		</AdminActions>
	</div>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids
		visible_ids={list_result.items.map((item) => String(item.number))}
		{busy}
	>
		{#snippet filters()}
			<div class="stack" style:--stack-gap="var(--pad-small)">
				<AdminSearch
				text={search_text}
				on_input={(value) => update_url({ q: value || null, page: null })}
			/>
				<div
					class="flex"
					style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
				>
					<label class="stack" style="--stack-gap: 2px">
						<span class="fs-1">From</span>
						<input
							type="date"
							value={date_from}
							onchange={(e) =>
								update_url({ date_from: e.currentTarget.value || null, page: null })}
						/>
					</label>
					<label class="stack" style="--stack-gap: 2px">
						<span class="fs-1">To</span>
						<input
							type="date"
							value={date_to}
							onchange={(e) =>
								update_url({ date_to: e.currentTarget.value || null, page: null })}
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
					{#if show_clear_filters}
						<a class="button small" href="/admin/content/podcast">× Clear</a>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet bulk()}
			<div
				class="flex"
				style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: center"
			>
				<SelectMenu
					popover_id="filter-bulk_status"
					button_text={`Bulk status (${bulk_status})`}
					button_icon="filter"
					value={bulk_status}
					options={BULK_STATUS_OPTIONS}
					onselect={(value) => update_url({ bulk_status: value || null })}
				/>
				<button type="button" onclick={run_bulk_status_update} disabled={busy}>
					Update status
				</button>
			</div>
		{/snippet}

		{#snippet action_feedback()}
			{#if action_message}
				<p class="fs-2" style="color: var(--c-green)">{action_message}</p>
			{/if}
			{#if action_error}
				<p class="fs-2" style="color: var(--c-red)">{action_error}</p>
			{/if}
		{/snippet}

		{#snippet table_head({ all_visible_selected, indeterminate, toggle_all_visible })}
			<th>
				<input
					type="checkbox"
					aria-label="Select all rows on this page"
					checked={all_visible_selected}
					{indeterminate}
					onchange={(event) => {
						const target = event.currentTarget;
						if (!(target instanceof HTMLInputElement)) return;
						toggle_all_visible(target.checked);
					}}
				/>
			</th>
			<th>Number</th>
			<th>Title</th>
			<th>Status</th>
			<th>Date</th>
			<th>Show type</th>
		{/snippet}

		{#snippet table_body({ toggle_selected, is_selected })}
			{#each list_result.items as show_row (show_row.number)}
				{@const row_id = String(show_row.number)}
				{@const public_link = `/show/${show_row.number}/${show_row.slug}`}
				{@const edit_link = `/admin/content/podcast/${show_row.number}`}
				<tr>
					<td>
						<input
							type="checkbox"
							aria-label={`Select ${show_row.title}`}
							checked={is_selected(row_id)}
							onchange={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								toggle_selected(row_id, target.checked);
							}}
						/>
					</td>
					<td>#{show_row.number}</td>
					<td>
						<div class="stack" style:--stack-gap="var(--pad-xsmall)">
							<a href={public_link} target="_blank" rel="noopener noreferrer">
								{show_row.title}
							</a>
							<a href={edit_link}>Edit</a>
						</div>
					</td>
					<td><StatusBadge status={show_row.meta?.status} /></td>
					<td>{format(show_row.date, 'MMM d, yyyy')}</td>
					<td>{to_show_type_label(show_row)}</td>
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
