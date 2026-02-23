<script lang="ts">
	import { format } from 'date-fns';
	import { page as current_page } from '$app/state';
	import AdminSearch from '../AdminSearch.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import {
		assign_content_tags,
		bulk_delete_content,
		bulk_update_status,
		get_tag_options,
		remove_content_tags,
		list_content
	} from './admin_content.remote';

	type ContentStatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	type ContentTypeFilter =
		| 'ALL'
		| 'PODCAST'
		| 'ARTICLE'
		| 'VIDEO'
		| 'TOOL'
		| 'NEWSLETTER'
		| 'EVENT';
	type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	const STATUS_FILTERS: ContentStatusFilter[] = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'];
	const TYPE_FILTERS: ContentTypeFilter[] = [
		'ALL',
		'PODCAST',
		'ARTICLE',
		'VIDEO',
		'TOOL',
		'NEWSLETTER',
		'EVENT'
	];
	const BULK_STATUSES: ContentStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((status_value) => ({
		value: status_value === 'ALL' ? '' : status_value,
		label: status_value === 'ALL' ? 'All' : status_value
	}));
	const TYPE_FILTER_OPTIONS = TYPE_FILTERS.map((type_value) => ({
		value: type_value === 'ALL' ? '' : type_value,
		label: type_value === 'ALL' ? 'All' : type_value
	}));
	const BULK_STATUS_OPTIONS = BULK_STATUSES.map((status_value) => ({
		value: status_value,
		label: status_value
	}));

	let search_text = $state('');
	let status_filter = $derived.by(() => {
		const status_value = current_page.url.searchParams.get('status');
		if (!status_value) {
			return 'ALL';
		}

		return STATUS_FILTERS.includes(status_value as ContentStatusFilter)
			? (status_value as ContentStatusFilter)
			: 'ALL';
	});

	let type_filter = $derived.by(() => {
		const type_value = current_page.url.searchParams.get('type');
		if (!type_value) {
			return 'ALL';
		}

		return TYPE_FILTERS.includes(type_value as ContentTypeFilter)
			? (type_value as ContentTypeFilter)
			: 'ALL';
	});

	let clear_filter_link = $derived('/admin/content');
	let show_clear_filters = $derived(status_filter !== 'ALL' || type_filter !== 'ALL');
	let date_from = $state('');
	let date_to = $state('');
	let page = $state(1);
	let selected_content_ids = $state<string[]>([]);
	let bulk_selected_tag_ids = $state<string[]>([]);
	let bulk_status = $derived.by(() => {
		const bulk_status_value = current_page.url.searchParams.get('bulk_status');
		if (!bulk_status_value) {
			return 'DRAFT';
		}

		return BULK_STATUSES.includes(bulk_status_value as ContentStatus)
			? (bulk_status_value as ContentStatus)
			: 'DRAFT';
	});
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	type BulkTagOption = { id: string; name: string };
	let bulk_tag_options = $state<BulkTagOption[]>([]);
	type ContentListResult = Awaited<ReturnType<typeof list_content>>;
	type ContentListItem = ContentListResult['items'][number];

	async function load_bulk_tag_options() {
		try {
			const options = await get_tag_options();
			bulk_tag_options = options.map((tag_option: { id: string; name: string }) => ({
				id: tag_option.id,
				name: tag_option.name
			}));
		} catch (error) {
			console.error(error);
		}
	}

	void load_bulk_tag_options();

	function get_list_content_query() {
		return list_content({
			search_text,
			status: status_filter,
			type: type_filter,
			date_from_iso: date_from || undefined,
			date_to_iso: date_to || undefined,
			page,
			page_size: 25
		});
	}

	let list_result_promise = $derived.by(() => get_list_content_query());

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	function toggle_selected(content_id: string, checked: boolean) {
		if (checked) {
			if (!selected_content_ids.includes(content_id)) {
				selected_content_ids = [...selected_content_ids, content_id];
			}
			return;
		}

		selected_content_ids = selected_content_ids.filter((id) => id !== content_id);
	}

	function toggle_all_visible(checked: boolean, visible_items: ContentListItem[]) {
		selected_content_ids = checked ? visible_items.map((item) => item.id) : [];
	}

	async function run_bulk_status_update() {
		if (selected_content_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		clear_feedback();
		busy = true;

		try {
			const result = await bulk_update_status({
				content_ids: selected_content_ids,
				status: bulk_status
			});
			action_message = `Updated ${result.count} item(s) to ${bulk_status}.`;
			selected_content_ids = [];
			await get_list_content_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to update status. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_delete() {
		if (selected_content_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}
		clear_feedback();

		const confirm_text = window.prompt('Type DELETE to confirm deleting selected items');
		if (confirm_text !== 'DELETE') {
			action_message = 'Delete cancelled.';
			return;
		}
		busy = true;

		try {
			const result = await bulk_delete_content({
				content_ids: selected_content_ids,
				confirm_text
			});

			action_message = `Deleted ${result.deleted_count} item(s). Skipped ${result.skipped_count} non-article item(s).`;
			selected_content_ids = [];
			await get_list_content_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to delete selected rows. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_add_tags() {
		clear_feedback();

		if (selected_content_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		if (bulk_selected_tag_ids.length === 0) {
			action_error = 'Select at least one tag first.';
			return;
		}

		busy = true;

		try {
			const result = await assign_content_tags({
				content_ids: selected_content_ids,
				tag_ids: bulk_selected_tag_ids
			});

			action_message = `Added ${bulk_selected_tag_ids.length} tag(s) to ${selected_content_ids.length} item(s). (${result.count} assignment(s) processed)`;
			selected_content_ids = [];
			await get_list_content_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to add tags to selected rows. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_remove_tags() {
		clear_feedback();

		if (selected_content_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		if (bulk_selected_tag_ids.length === 0) {
			action_error = 'Select at least one tag first.';
			return;
		}

		busy = true;

		try {
			await remove_content_tags({
				content_ids: selected_content_ids,
				tag_ids: bulk_selected_tag_ids
			});

			action_message = `Removed ${bulk_selected_tag_ids.length} tag(s) from ${selected_content_ids.length} item(s).`;
			selected_content_ids = [];
			await get_list_content_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to remove tags from selected rows. Please try again.';
		} finally {
			busy = false;
		}
	}

	function to_public_link(content_row: ContentListItem) {
		if (content_row.show) {
			return `/show/${content_row.show.number}/${content_row.show.slug}`;
		}

		if (content_row.video) {
			return content_row.video.url;
		}

		return null;
	}

	function go_previous_page(page_number: number) {
		if (page_number <= 1) {
			return;
		}

		page = page_number - 1;
	}

	function go_next_page(page_number: number, total_pages: number) {
		if (page_number >= total_pages) {
			return;
		}

		page = page_number + 1;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Content</h1>

	<div class="stack" style:--stack-gap="var(--pad-small)">
		<AdminSearch bind:text={search_text} />
		<div class="flex" style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end">
			<SelectMenu
				popover_id="filter-status"
				button_text={`Status ${status_filter !== 'ALL' ? `(${status_filter})` : ''}`}
				button_icon={'filter' as any}
				value={status_filter === 'ALL' ? '' : status_filter}
				options={STATUS_FILTER_OPTIONS}
			/>
			<SelectMenu
				popover_id="filter-type"
				button_text={`Type ${type_filter !== 'ALL' ? `(${type_filter})` : ''}`}
				button_icon={'filter' as any}
				value={type_filter === 'ALL' ? '' : type_filter}
				options={TYPE_FILTER_OPTIONS}
			/>
			<label class="stack" style="--stack-gap: 2px">
				<span class="fs-1">From</span>
				<input type="date" bind:value={date_from} />
			</label>
			<label class="stack" style="--stack-gap: 2px">
				<span class="fs-1">To</span>
				<input type="date" bind:value={date_to} />
			</label>
			{#if show_clear_filters}
				<a class="button small" href={clear_filter_link}>× Clear</a>
			{/if}
		</div>
	</div>

	{#if selected_content_ids.length > 0}
		<div
			class="stack bg-shade-or-tint-light br-small"
			style="padding: var(--pad-small); --stack-gap: var(--pad-small)"
			aria-label="Bulk actions"
		>
			<div class="split" style:--split-gap="var(--pad-small)">
				<span class="fs-2 fv-700">Bulk Actions</span>
				<span class="fs-2 primary">{selected_content_ids.length} selected</span>
			</div>

			<MultiSelect
				options={bulk_tag_options}
				bind:selected_ids={bulk_selected_tag_ids}
				label="Tags"
				placeholder="Search tags"
			/>
			<div class="flex" style="--flex-gap: var(--pad-small); flex-wrap: wrap">
				<button
					type="button"
					onclick={run_bulk_add_tags}
					disabled={busy || bulk_selected_tag_ids.length === 0}
				>
					Add tags
				</button>
				<button
					type="button"
					onclick={run_bulk_remove_tags}
					disabled={busy || bulk_selected_tag_ids.length === 0}
				>
					Remove tags
				</button>
			</div>

			<div class="flex" style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: center">
				<SelectMenu
					popover_id="filter-bulk_status"
					button_text={`Bulk status (${bulk_status})`}
					button_icon={'filter' as any}
					value={bulk_status}
					options={BULK_STATUS_OPTIONS}
				/>
				<button type="button" onclick={run_bulk_status_update} disabled={busy}>
					Update status
				</button>
				<button type="button" onclick={run_bulk_delete} disabled={busy}> Delete selected </button>
			</div>
		</div>
	{/if}

	{#if action_message}
		<p class="fs-2" style="color: var(--c-green)">{action_message}</p>
	{/if}

	{#if action_error}
		<p class="fs-2" style="color: var(--c-red)">{action_error}</p>
	{/if}

	{#await list_result_promise}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>
							<input type="checkbox" aria-label="Select all rows on this page" disabled />
						</th>
						<th>Title</th>
						<th>Status</th>
						<th>Type</th>
						<th>Published</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan="6">Loading content...</td>
					</tr>
				</tbody>
			</table>
		</div>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const total = list_result.total}
		{@const total_pages = list_result.total_pages}
		{@const page_number = list_result.page}
		{@const all_visible_selected =
			list_items.length > 0 && list_items.every((item) => selected_content_ids.includes(item.id))}

		<div class="split" style:--split-gap="var(--pad-small)" aria-label="Pagination controls">
			<button
				type="button"
				onclick={() => go_previous_page(page_number)}
				disabled={page_number <= 1 || busy}>Previous</button
			>
			<p class="fs-2">Page {page_number} of {total_pages} ({total} total)</p>
			<button
				type="button"
				onclick={() => go_next_page(page_number, total_pages)}
				disabled={page_number >= total_pages || busy}>Next</button
			>
		</div>

		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>
							<input
								type="checkbox"
								aria-label="Select all rows on this page"
								checked={all_visible_selected}
								onchange={(event) => {
									const target = event.currentTarget;
									if (!(target instanceof HTMLInputElement)) {
										return;
									}

									toggle_all_visible(target.checked, list_items);
								}}
							/>
						</th>
						<th>Title</th>
						<th>Status</th>
						<th>Type</th>
						<th>Published</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if list_items.length === 0}
						<tr>
							<td colspan="6">No matching content found.</td>
						</tr>
					{:else}
						{#each list_items as content_row (content_row.id)}
							<tr>
								<td>
									<input
										type="checkbox"
										aria-label={`Select ${content_row.title}`}
										checked={selected_content_ids.includes(content_row.id)}
										onchange={(event) => {
											const target = event.currentTarget;
											if (!(target instanceof HTMLInputElement)) {
												return;
											}

											toggle_selected(content_row.id, target.checked);
										}}
									/>
								</td>
								<td>
									<div class="stack" style:--stack-gap="var(--pad-xsmall)">
										<p>{content_row.title}</p>
										<div class="flex" style:--flex-gap="var(--pad-xsmall)">
											<a href={`/admin/content/${content_row.id}`}>Edit</a>
											{#if to_public_link(content_row)}
												<a
													href={to_public_link(content_row) || '#'}
													target="_blank"
													rel="noopener noreferrer">Public [↗]</a
												>
											{/if}
											<a
												href={`/preview/${content_row.id}`}
												target="_blank"
												rel="noopener noreferrer">Preview [↗]</a
											>
										</div>
									</div>
								</td>
								<td>{content_row.status}</td>
								<td>{content_row.type}</td>
								<td>
									{#if content_row.published_at}
										{format(content_row.published_at, 'MMM d, yyyy HH:mm')}
									{:else}
										-
									{/if}
								</td>
								<td>
									<a href={`/admin/content/${content_row.id}`}>Open</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{:catch}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Status</th>
						<th>Type</th>
						<th>Published</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan="5">Unable to load content. Please try again.</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/await}
</div>
