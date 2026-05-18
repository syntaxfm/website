<script lang="ts">
	import { formatDistance } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string
	} from '$lib/admin/admin_filters';
	import {
		bulk_delete_submissions,
		bulk_update_submission_status,
		delete_submission,
		get_submissions,
		update_submission_status
	} from './admin_submissions.remote';

	const STATUS_VALUES = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const;
	const TYPE_VALUES = ['POTLUCK', 'SPOOKY', 'GUEST', 'FEEDBACK', 'OTHER', 'OSS'] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const PAGE_SIZE_VALUES = ['10', '20', '40', '100'] as const;
	const FILTER_KEYS = ['q', 'status', 'submission_type', 'order', 'page_size'] as const;
	const DEFAULT_PAGE_SIZE = '20';

	type SubmissionStatus = (typeof STATUS_VALUES)[number];
	type SubmissionType = (typeof TYPE_VALUES)[number];
	type SubmissionOrder = (typeof ORDER_VALUES)[number];
	type PageSizeValue = (typeof PAGE_SIZE_VALUES)[number];

	const STATUS_FILTER_OPTIONS = [
		{ value: '', label: 'All' },
		...STATUS_VALUES.map((value) => ({ value, label: value }))
	];
	const TYPE_FILTER_OPTIONS = [
		{ value: '', label: 'All' },
		...TYPE_VALUES.map((value) => ({ value, label: value }))
	];
	const ORDER_OPTIONS = [
		{ value: 'desc', label: 'Newest To Oldest' },
		{ value: 'asc', label: 'Oldest To Newest' }
	];
	const PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES.map((value) => ({ value, label: value }));
	const BULK_STATUS_OPTIONS = STATUS_VALUES.map((value) => ({ value, label: value }));

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist<SubmissionStatus | ''>(
			current_page.url.searchParams,
			'status',
			['', ...STATUS_VALUES] as const,
			''
		)
	);
	let type_filter = $derived(
		read_picklist<SubmissionType | ''>(
			current_page.url.searchParams,
			'submission_type',
			['', ...TYPE_VALUES] as const,
			''
		)
	);
	let order = $derived(
		read_picklist<SubmissionOrder>(current_page.url.searchParams, 'order', ORDER_VALUES, 'desc')
	);

	let page_size_value = $derived(
		read_picklist<PageSizeValue>(
			current_page.url.searchParams,
			'page_size',
			PAGE_SIZE_VALUES,
			DEFAULT_PAGE_SIZE
		)
	);

	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let bulk_status = $derived(
		read_picklist<SubmissionStatus>(
			current_page.url.searchParams,
			'bulk_status',
			STATUS_VALUES,
			'APPROVED'
		)
	);
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_submission_ids = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	const submission_results = await get_submissions({
		search_text,
		status: status_filter,
		submission_type: type_filter,
		order,
		page: page_number,
		page_size: Number.parseInt(page_size_value, 10)
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

	async function set_submission_status(submission_id: string, next_status: string) {
		clear_feedback();
		busy = true;
		try {
			await update_submission_status({ id: submission_id, status: next_status });
			action_message = `Updated submission to ${next_status}.`;
			await get_submissions({
				search_text,
				status: status_filter,
				submission_type: type_filter,
				order,
				page: page_number,
				page_size: Number.parseInt(page_size_value, 10)
			}).refresh();
		} catch (error_value) {
			console.error('update_submission_status failed', error_value);
			action_error = 'Unable to update submission status. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function remove_submission(submission_id: string) {
		if (!window.confirm('Are you sure you want to delete this submission?')) return;

		clear_feedback();
		busy = true;
		try {
			await delete_submission({ id: submission_id });
			action_message = 'Submission deleted.';
			selected_submission_ids = selected_submission_ids.filter((id) => id !== submission_id);
			await get_submissions({
				search_text,
				status: status_filter,
				submission_type: type_filter,
				order,
				page: page_number,
				page_size: Number.parseInt(page_size_value, 10)
			}).refresh();
		} catch (error_value) {
			console.error('delete_submission failed', error_value);
			action_error = 'Unable to delete submission. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_status_update() {
		if (selected_submission_ids.length === 0) {
			action_error = 'Select at least one submission first.';
			return;
		}
		clear_feedback();
		busy = true;

		try {
			const result = await bulk_update_submission_status({
				submission_ids: selected_submission_ids,
				status: bulk_status
			});
			action_message = `Updated ${result.count} submission(s) to ${bulk_status}.`;
			selected_submission_ids = [];
			await get_submissions({
				search_text,
				status: status_filter,
				submission_type: type_filter,
				order,
				page: page_number,
				page_size: Number.parseInt(page_size_value, 10)
			}).refresh();
		} catch (error_value) {
			console.error('bulk_update_submission_status failed', error_value);
			action_error = 'Unable to update submissions. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_delete() {
		if (selected_submission_ids.length === 0) {
			action_error = 'Select at least one submission first.';
			return;
		}
		clear_feedback();

		const confirm_text = window.prompt('Type DELETE to confirm deleting selected submissions');
		if (confirm_text !== 'DELETE') {
			action_message = 'Delete cancelled.';
			return;
		}
		busy = true;

		try {
			const result = await bulk_delete_submissions({
				submission_ids: selected_submission_ids,
				confirm_text
			});
			action_message = `Deleted ${result.deleted_count} submission(s).`;
			selected_submission_ids = [];
			await get_submissions({
				search_text,
				status: status_filter,
				submission_type: type_filter,
				order,
				page: page_number,
				page_size: Number.parseInt(page_size_value, 10)
			}).refresh();
		} catch (error_value) {
			console.error('bulk_delete_submissions failed', error_value);
			action_error = 'Unable to delete submissions. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	{#await submission_results}
		<h1 class="h3">Submissions</h1>
		<p class="fs-2">Loading submissions...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<h1 class="h3">Submissions ({list_result.total})</h1>

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
			bind:selected_ids={selected_submission_ids}
			{visible_ids}
			{busy}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch
						text={search_text}
						on_input={(value) => update_url({ q: value || null, page: null })}
						placeholder="Search name, email, or body"
					/>
					<div
						class="flex"
						style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
					>
						<SelectMenu
							popover_id="filter-submission_type"
							button_text={`Type ${type_filter !== '' ? `(${type_filter})` : ''}`}
							button_icon={'filter' as any}
							value={type_filter}
							options={TYPE_FILTER_OPTIONS}
							onselect={(value) => update_url({ submission_type: value || null, page: null })}
						/>
						<SelectMenu
							popover_id="filter-status"
							button_text={`Status ${status_filter !== '' ? `(${status_filter})` : ''}`}
							button_icon={'filter' as any}
							value={status_filter}
							options={STATUS_FILTER_OPTIONS}
							onselect={(value) => update_url({ status: value || null, page: null })}
						/>
						<SelectMenu
							popover_id="filter-order"
							button_text="Sort"
							button_icon={'sort' as any}
							value={order}
							options={ORDER_OPTIONS}
							onselect={(value) =>
								update_url({ order: value === 'desc' ? null : value, page: null })}
						/>
						<SelectMenu
							popover_id="filter-page_size"
							value_as_label
							button_text="Per Page"
							value={page_size_value}
							options={PAGE_SIZE_OPTIONS}
							onselect={(value) =>
								update_url({
									page_size: value === DEFAULT_PAGE_SIZE ? null : value,
									page: null
								})}
						/>
						{#if show_clear_filters}
							<a class="button small" href="/admin/submissions">× Clear</a>
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
						button_icon={'filter' as any}
						value={bulk_status}
						options={BULK_STATUS_OPTIONS}
						onselect={(value) => update_url({ bulk_status: value || null })}
					/>
					<button type="button" onclick={run_bulk_status_update} disabled={busy}>
						Update status
					</button>
					<button type="button" onclick={run_bulk_delete} disabled={busy}>Delete selected</button>
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

			{#snippet table_head({ all_visible_selected, toggle_all_visible })}
				<th>
					<input
						type="checkbox"
						aria-label="Select all submissions on this page"
						checked={all_visible_selected}
						onchange={(event) => {
							const target = event.currentTarget;
							if (!(target instanceof HTMLInputElement)) return;
							toggle_all_visible(target.checked);
						}}
					/>
				</th>
				<th>From</th>
				<th>Type</th>
				<th>Body</th>
				<th>Received</th>
				<th>Status</th>
				<th>Actions</th>
			{/snippet}

			{#snippet table_body({ toggle_selected, is_selected })}
				{#each list_items as submission (submission.id)}
					<tr>
						<td>
							<input
								type="checkbox"
								aria-label={`Select submission from ${submission.name || 'Anon'}`}
								checked={is_selected(submission.id)}
								onchange={(event) => {
									const target = event.currentTarget;
									if (!(target instanceof HTMLInputElement)) return;
									toggle_selected(submission.id, target.checked);
								}}
							/>
						</td>
						<td>
							<div class="stack" style:--stack-gap="var(--pad-xsmall)">
								<span>{submission.name || 'Anon'}</span>
								<span class="fs-1">{submission.email || 'No email'}</span>
							</div>
						</td>
						<td>{submission.submission_type}</td>
						<td>
							<textarea class="submission-body" readonly
								>{submission.body.replaceAll('\n', '\n\n').trim()}</textarea
							>
						</td>
						<td class="fs-1">
							{formatDistance(new Date(submission.created_at), new Date(), {
								addSuffix: true
							})}
						</td>
						<td>
							<SelectMenu
								popover_id="status-{submission.id}"
								button_text={submission.status}
								value={submission.status}
								disabled={busy}
								options={STATUS_VALUES.map((status_value) => ({
									value: status_value,
									label: status_value
								}))}
								onselect={(next_status) => {
									void set_submission_status(submission.id, next_status);
								}}
							/>
						</td>
						<td>
							<button
								class="warning"
								type="button"
								disabled={busy}
								onclick={() => {
									void remove_submission(submission.id);
								}}
							>
								Delete
							</button>
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
		<h1 class="h3">Submissions</h1>
		<p class="fs-2" style="color: var(--c-red)">Unable to load submissions. Please try again.</p>
	{/await}
</div>

<style>
	.submission-body {
		max-width: 480px;
		min-width: 240px;
		max-height: 200px;
		overflow-y: auto;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		field-sizing: content;
		border: none;
		background: transparent;
	}
</style>
