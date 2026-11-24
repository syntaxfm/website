<script lang="ts">
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
		bulk_update_submission_status,
		get_submissions,
		update_submission_status
	} from './admin_submissions.remote';

	const STATUS_VALUES = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const;
	const TYPE_VALUES = ['POTLUCK', 'SPOOKY', 'GUEST', 'FEEDBACK', 'OTHER', 'OSS'] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const PAGE_SIZE_VALUES = ['10', '20', '40', '100'] as const;
	const FILTER_KEYS = [
		'q',
		'status',
		'submission_type',
		'date_from',
		'date_to',
		'order',
		'page_size'
	] as const;
	const DEFAULT_PAGE_SIZE = '20';

	const STATUS_FILTER_OPTIONS = to_filter_options(STATUS_VALUES, { include_all: true });
	const TYPE_FILTER_OPTIONS = to_filter_options(TYPE_VALUES, { include_all: true });
	const STATUS_OPTIONS = to_filter_options(STATUS_VALUES);
	const ORDER_OPTIONS = [
		{ value: 'desc', label: 'Newest first' },
		{ value: 'asc', label: 'Oldest first' }
	];
	const PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES.map((value) => ({
		value,
		label: `${value} per page`
	}));

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist(current_page.url.searchParams, 'status', ['', ...STATUS_VALUES] as const, '')
	);
	let type_filter = $derived(
		read_picklist(
			current_page.url.searchParams,
			'submission_type',
			['', ...TYPE_VALUES] as const,
			''
		)
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let order = $derived(read_picklist(current_page.url.searchParams, 'order', ORDER_VALUES, 'desc'));
	let page_size_value = $derived(
		read_picklist(current_page.url.searchParams, 'page_size', PAGE_SIZE_VALUES, DEFAULT_PAGE_SIZE)
	);
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_submission_ids = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	// The list's query, also used to refresh it after a status change
	let list_query = $derived({
		search_text,
		status: status_filter,
		submission_type: type_filter,
		date_from_iso: date_from || undefined,
		date_to_iso: date_to || undefined,
		order,
		page: page_number,
		page_size: Number.parseInt(page_size_value, 10)
	});

	const submission_results = $derived(get_submissions(list_query));

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replace: true,
			reset: false
		});
	}

	async function set_submission_status(submission_id: string, next_status: string) {
		action_message = '';
		action_error = '';
		busy = true;
		try {
			await update_submission_status({ id: submission_id, status: next_status });
			action_message = `Set submission to ${humanize_enum(next_status)}.`;
			await get_submissions(list_query).refresh();
		} catch (error_value) {
			console.error('update_submission_status failed', error_value);
			action_error = 'Unable to update submission status. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_status_update(next_status: string) {
		action_message = '';
		action_error = '';
		busy = true;

		try {
			const result = await bulk_update_submission_status({
				submission_ids: selected_submission_ids,
				status: next_status
			});
			action_message = `Set ${result.count} submission(s) to ${humanize_enum(next_status)}.`;
			selected_submission_ids = [];
			await get_submissions(list_query).refresh();
		} catch (error_value) {
			console.error('bulk_update_submission_status failed', error_value);
			action_error = 'Unable to update submissions. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Submissions | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<AdminPageHeader title="Submissions" />

	{#await submission_results}
		<p class="admin-feedback" role="status">Loading submissions...</p>
	{:then list_result}
		<AdminList
			total={list_result.total}
			page={list_result.page}
			total_pages={list_result.total_pages}
			on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
			bind:selected_ids={selected_submission_ids}
			visible_ids={list_result.items.map((item) => item.id)}
			{busy}
			message={action_message}
			error={action_error}
			clear_href={show_clear_filters ? resolve('admin/submissions') : null}
		>
			{#snippet filters()}
				<AdminSearch
					text={search_text}
					on_input={(value) => update_url({ q: value || null, page: null })}
					placeholder="Search name, email, or body"
				/>
				<AdminDateRange
					from={date_from}
					to={date_to}
					onchange={(key, value) => update_url({ [key]: value || null, page: null })}
				/>
				<AdminFilterMenu
					label="Type"
					value={type_filter}
					options={TYPE_FILTER_OPTIONS}
					onselect={(value) => update_url({ submission_type: value || null, page: null })}
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
				<AdminFilterMenu
					label="Per page"
					value={page_size_value}
					options={PAGE_SIZE_OPTIONS}
					onselect={(value) =>
						update_url({ page_size: value === DEFAULT_PAGE_SIZE ? null : value, page: null })}
				/>
			{/snippet}

			{#snippet bulk()}
				<AdminFilterMenu
					label="Set status"
					options={STATUS_OPTIONS}
					disabled={busy}
					onselect={run_bulk_status_update}
				/>
			{/snippet}

			{#snippet table_head()}
				<th>From</th>
				<th>Type</th>
				<th>Body</th>
				<th>Received</th>
				<th>Status</th>
				<th><span class="admin-visually-hidden">Actions</span></th>
			{/snippet}

			{#snippet table_body({ select_cell })}
				{#each list_result.items as submission (submission.id)}
					<tr>
						{@render select_cell(submission.id, `submission from ${submission.name || 'Anon'}`)}
						<AdminTitleCell title={submission.name || 'Anon'} detail={submission.email} />
						<td class="admin-cell-muted">{humanize_enum(submission.submission_type)}</td>
						<td>
							<details class="submission-body">
								<summary>{submission.body.trim()}</summary>
								<p>{submission.body.trim()}</p>
							</details>
						</td>
						<AdminDateCell value={submission.created_at} />
						<td>
							<AdminFilterMenu
								label={humanize_enum(submission.status)}
								value={submission.status}
								options={STATUS_OPTIONS}
								disabled={busy}
								onselect={(next_status) => set_submission_status(submission.id, next_status)}
							/>
						</td>
						<td class="admin-cell-actions">
							{#if submission.status === 'COMPLETED'}
								<button
									type="button"
									data-intent="quiet"
									disabled={busy}
									onclick={() => set_submission_status(submission.id, 'PENDING')}
								>
									Reopen
								</button>
							{:else}
								<button
									type="button"
									disabled={busy}
									onclick={() => set_submission_status(submission.id, 'COMPLETED')}
								>
									Close
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="7">No matching submissions found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="admin-feedback" data-tone="negative" role="alert">
			Unable to load submissions. Please try again.
		</p>
	{/await}
</div>

<style>
	/* The message takes whatever width is left, so the table fits its box */
	.submission-body {
		min-width: 14rem;
	}

	/* Clamp to two lines until expanded; no heavy textarea, no scrollbars. */
	.submission-body summary {
		list-style: none;
		cursor: pointer;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		white-space: pre-wrap;
		/* Long words and links break, so they can't force the table wider */
		overflow-wrap: anywhere;
	}

	.submission-body summary::-webkit-details-marker {
		display: none;
	}

	.submission-body[open] summary {
		display: none;
	}

	.submission-body p {
		margin: 0;
		max-height: 320px;
		overflow-y: auto;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
</style>
