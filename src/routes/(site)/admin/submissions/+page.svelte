<script lang="ts">
	import { formatDistance } from 'date-fns';
	import { page as current_page } from '$app/state';
	import { createUseQueryParams } from 'svelte-query-params';
	import { sveltekit } from 'svelte-query-params/adapters/sveltekit';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import {
		bulk_delete_submissions,
		bulk_update_submission_status,
		delete_submission,
		get_submissions,
		update_submission_status
	} from './admin_submissions.remote';

	const STATUS_VALUES = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const;
	const STATUS_FILTER_VALUES = ['', ...STATUS_VALUES] as const;
	const TYPE_VALUES = ['POTLUCK', 'SPOOKY', 'GUEST', 'FEEDBACK', 'OTHER', 'OSS'] as const;
	const TYPE_FILTER_VALUES = ['', ...TYPE_VALUES] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const PAGE_SIZE_VALUES = ['10', '20', '40', '100'] as const;

	type SubmissionStatus = (typeof STATUS_VALUES)[number];
	type SubmissionStatusFilter = (typeof STATUS_FILTER_VALUES)[number];
	type SubmissionTypeFilter = (typeof TYPE_FILTER_VALUES)[number];
	type SubmissionOrder = (typeof ORDER_VALUES)[number];
	type PageSizeValue = (typeof PAGE_SIZE_VALUES)[number];

	const DEFAULT_PAGE_SIZE: PageSizeValue = '20';

	type QueryValue = string | string[] | undefined;

	function first(value: QueryValue): string {
		if (Array.isArray(value)) return value[0] ?? '';
		return value ?? '';
	}

	function picklist<T extends string>(allowed: readonly T[], fallback: T) {
		return (value: QueryValue): T => {
			const raw = first(value);
			return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
		};
	}

	function string_default(fallback = '') {
		return (value: QueryValue): string => first(value) || fallback;
	}

	function page_int(value: QueryValue): number {
		const parsed = Number.parseInt(first(value), 10);
		if (!Number.isFinite(parsed) || parsed < 1) return 1;
		return parsed;
	}

	const use_params = createUseQueryParams(
		{
			q: string_default(''),
			status: picklist<SubmissionStatusFilter>(STATUS_FILTER_VALUES, ''),
			submission_type: picklist<SubmissionTypeFilter>(TYPE_FILTER_VALUES, ''),
			order: picklist<SubmissionOrder>(ORDER_VALUES, 'desc'),
			page_size: picklist<PageSizeValue>(PAGE_SIZE_VALUES, DEFAULT_PAGE_SIZE),
			page: page_int,
			bulk_status: picklist<SubmissionStatus>(STATUS_VALUES, 'APPROVED')
		},
		{
			adapter: sveltekit({ replace: true }),
			debounce: 250
		}
	);

	const [params, helpers] = use_params(current_page.url);

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

	let selected_submission_ids = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	let url_q = $derived(current_page.url.searchParams.get('q') ?? '');
	let url_status = $derived(
		picklist<SubmissionStatusFilter>(STATUS_FILTER_VALUES, '')(
			current_page.url.searchParams.get('status') ?? undefined
		)
	);
	let url_submission_type = $derived(
		picklist<SubmissionTypeFilter>(TYPE_FILTER_VALUES, '')(
			current_page.url.searchParams.get('submission_type') ?? undefined
		)
	);
	let url_order = $derived(
		picklist<SubmissionOrder>(ORDER_VALUES, 'desc')(
			current_page.url.searchParams.get('order') ?? undefined
		)
	);
	let url_page_size = $derived(
		picklist<PageSizeValue>(PAGE_SIZE_VALUES, DEFAULT_PAGE_SIZE)(
			current_page.url.searchParams.get('page_size') ?? undefined
		)
	);
	let url_page = $derived(page_int(current_page.url.searchParams.get('page') ?? undefined));

	let show_clear_filters = $derived(
		url_q !== '' ||
			url_status !== '' ||
			url_submission_type !== '' ||
			url_order !== 'desc' ||
			url_page_size !== DEFAULT_PAGE_SIZE
	);

	function get_submissions_query() {
		return get_submissions({
			search_text: url_q,
			status: url_status,
			submission_type: url_submission_type,
			order: url_order,
			page: url_page,
			page_size: Number.parseInt(url_page_size, 10)
		});
	}

	let list_result_promise = $derived.by(() => get_submissions_query());

	function on_status_select(next_value: string) {
		const next = (next_value || '') as SubmissionStatusFilter;
		helpers.update({ status: next, page: 1 });
	}

	function on_type_select(next_value: string) {
		const next = (next_value || '') as SubmissionTypeFilter;
		helpers.update({ submission_type: next, page: 1 });
	}

	function on_order_select(next_value: string) {
		const next = (next_value || 'desc') as SubmissionOrder;
		helpers.update({ order: next, page: 1 });
	}

	function on_page_size_select(next_value: string) {
		const next = (next_value || DEFAULT_PAGE_SIZE) as PageSizeValue;
		helpers.update({ page_size: next, page: 1 });
	}

	function on_page_change(next_page: number) {
		helpers.update({ page: next_page });
	}

	function on_bulk_status_select(next_value: string) {
		const next = (next_value || 'APPROVED') as SubmissionStatus;
		helpers.update({ bulk_status: next });
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
			await get_submissions_query().refresh();
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
			await get_submissions_query().refresh();
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
				status: params.bulk_status
			});
			action_message = `Updated ${result.count} submission(s) to ${params.bulk_status}.`;
			selected_submission_ids = [];
			await get_submissions_query().refresh();
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
			await get_submissions_query().refresh();
		} catch (error_value) {
			console.error('bulk_delete_submissions failed', error_value);
			action_error = 'Unable to delete submissions. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	{#await list_result_promise}
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
			{on_page_change}
			bind:selected_ids={selected_submission_ids}
			{visible_ids}
			{busy}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch bind:text={params.q} placeholder="Search name, email, or body" />
					<div
						class="flex"
						style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
					>
						<SelectMenu
							popover_id="filter-submission_type"
							button_text={`Type ${params.submission_type !== '' ? `(${params.submission_type})` : ''}`}
							button_icon={'filter' as any}
							value={params.submission_type}
							options={TYPE_FILTER_OPTIONS}
							onselect={on_type_select}
						/>
						<SelectMenu
							popover_id="filter-status"
							button_text={`Status ${params.status !== '' ? `(${params.status})` : ''}`}
							button_icon={'filter' as any}
							value={params.status}
							options={STATUS_FILTER_OPTIONS}
							onselect={on_status_select}
						/>
						<SelectMenu
							popover_id="filter-order"
							button_text="Sort"
							button_icon={'sort' as any}
							value={params.order}
							options={ORDER_OPTIONS}
							onselect={on_order_select}
						/>
						<SelectMenu
							popover_id="filter-page_size"
							value_as_label
							button_text="Per Page"
							value={params.page_size}
							options={PAGE_SIZE_OPTIONS}
							onselect={on_page_size_select}
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
						button_text={`Bulk status (${params.bulk_status})`}
						button_icon={'filter' as any}
						value={params.bulk_status}
						options={BULK_STATUS_OPTIONS}
						onselect={on_bulk_status_select}
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
