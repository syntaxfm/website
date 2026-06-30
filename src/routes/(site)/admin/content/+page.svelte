<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import StatusBadge from '$lib/admin/StatusBadge.svelte';
	import { humanize_enum } from '$lib/utils/format_enum';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string
	} from '$lib/admin/admin_filters';
	import {
		assign_content_tags,
		bulk_delete_content,
		bulk_update_status,
		get_tag_options,
		remove_content_tags,
		list_content
	} from './admin_content.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const TYPE_FILTERS = [
		'ALL',
		'PODCAST',
		'ARTICLE',
		'VIDEO',
		'TOOL',
		'NEWSLETTER',
		'EVENT'
	] as const;
	const BULK_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const FILTER_KEYS = ['q', 'status', 'type', 'date_from', 'date_to', 'tag_id'] as const;
	const PAGE_SIZE = 25;

	type ContentStatusFilter = (typeof STATUS_FILTERS)[number];
	type ContentTypeFilter = (typeof TYPE_FILTERS)[number];
	type ContentStatus = (typeof BULK_STATUSES)[number];

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const TYPE_FILTER_OPTIONS = TYPE_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const BULK_STATUS_OPTIONS = BULK_STATUSES.map((value) => ({ value, label: value }));

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist<ContentStatusFilter>(
			current_page.url.searchParams,
			'status',
			STATUS_FILTERS,
			'ALL'
		)
	);
	let type_filter = $derived(
		read_picklist<ContentTypeFilter>(current_page.url.searchParams, 'type', TYPE_FILTERS, 'ALL')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let tag_id = $derived(read_string(current_page.url.searchParams, 'tag_id'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let bulk_status = $derived(
		read_picklist<ContentStatus>(
			current_page.url.searchParams,
			'bulk_status',
			BULK_STATUSES,
			'DRAFT'
		)
	);
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));
	let active_tag_name = $derived.by(() => {
		if (!tag_id) return '';
		return bulk_tag_options.find((tag_option) => tag_option.id === tag_id)?.name ?? '';
	});

	let selected_content_ids = $state<string[]>([]);
	let bulk_selected_tag_ids = $state<string[]>([]);
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

	const list_result = await list_content({
		search_text,
		status: status_filter,
		type: type_filter,
		date_from_iso: date_from || undefined,
		date_to_iso: date_to || undefined,
		tag_id: tag_id || undefined,
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
			await list_content({
				search_text,
				status: status_filter,
				type: type_filter,
				date_from_iso: date_from || undefined,
				date_to_iso: date_to || undefined,
				tag_id: tag_id || undefined,
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
			await list_content({
				search_text,
				status: status_filter,
				type: type_filter,
				date_from_iso: date_from || undefined,
				date_to_iso: date_to || undefined,
				tag_id: tag_id || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
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
			await list_content({
				search_text,
				status: status_filter,
				type: type_filter,
				date_from_iso: date_from || undefined,
				date_to_iso: date_to || undefined,
				tag_id: tag_id || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
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
			await list_content({
				search_text,
				status: status_filter,
				type: type_filter,
				date_from_iso: date_from || undefined,
				date_to_iso: date_to || undefined,
				tag_id: tag_id || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
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

	function to_edit_link(content_row: ContentListItem): string | null {
		if (content_row.type === 'ARTICLE') {
			return `/admin/content/articles/${content_row.id}`;
		}

		if (content_row.type === 'PODCAST' && content_row.show) {
			return `/admin/content/podcast/${content_row.show.number}`;
		}

		if (content_row.type === 'VIDEO') {
			return `/admin/content/videos/${content_row.id}`;
		}

		return null;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Content</h1>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids={selected_content_ids}
		visible_ids={list_result.items.map((item) => item.id)}
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
					style="

--flex-gap: var(--pad-small);

 flex-wrap: wrap; align-items: flex-end"
				>
					<label
						class="stack"
						style="

--stack-gap: 2px"
					>
						<span class="fs-1">From</span>
						<input
							type="date"
							value={date_from}
							onchange={(e) => update_url({ date_from: e.currentTarget.value || null, page: null })}
						/>
					</label>
					<label
						class="stack"
						style="

--stack-gap: 2px"
					>
						<span class="fs-1">To</span>
						<input
							type="date"
							value={date_to}
							onchange={(e) => update_url({ date_to: e.currentTarget.value || null, page: null })}
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
						popover_id="filter-type"
						button_text={`Type ${type_filter !== 'ALL' ? `(${type_filter})` : ''}`}
						button_icon="filter"
						value={type_filter === 'ALL' ? '' : type_filter}
						options={TYPE_FILTER_OPTIONS}
						onselect={(value) => update_url({ type: value || null, page: null })}
					/>
					{#if tag_id}
						<a
							class="button small"
							href={build_url(current_page.url, { tag_id: null, page: null })}
						>
							× Tag{active_tag_name ? `: ${active_tag_name}` : ''}
						</a>
					{/if}
					{#if show_clear_filters}
						<a class="button small" href="/admin/content">× Clear</a>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet bulk()}
			<MultiSelect
				options={bulk_tag_options}
				bind:selected_ids={bulk_selected_tag_ids}
				label="Tags"
				placeholder="Search tags"
			/>
			<div
				class="flex"
				style="

--flex-gap: var(--pad-small);

 flex-wrap: wrap"
			>
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

			<div
				class="flex"
				style="

--flex-gap: var(--pad-small);

 flex-wrap: wrap; align-items: center"
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
			<th>Title</th>
			<th>Status</th>
			<th>Type</th>
			<th>Published</th>
		{/snippet}

		{#snippet table_body({ toggle_selected, is_selected })}
			{#each list_result.items as content_row (content_row.id)}
				{@const edit_link = to_edit_link(content_row)}
				{@const public_link = to_public_link(content_row)}
				<tr>
					<td>
						<input
							type="checkbox"
							aria-label={`Select ${content_row.title}`}
							checked={is_selected(content_row.id)}
							onchange={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								toggle_selected(content_row.id, target.checked);
							}}
						/>
					</td>
					<td>
						<div class="stack" style:--stack-gap="var(--pad-xsmall)">
							{#if public_link}
								<a href={public_link} target="_blank" rel="noopener noreferrer">
									{content_row.title}
								</a>
							{:else}
								<p>{content_row.title}</p>
							{/if}
							{#if edit_link}
								<a href={edit_link}>Edit</a>
							{/if}
						</div>
					</td>
					<td><StatusBadge status={content_row.status} /></td>
					<td>{humanize_enum(content_row.type)}</td>
					<td>
						{#if content_row.published_at}
							{format(content_row.published_at, 'MMM d, yyyy HH:mm')}
						{:else}
							-
						{/if}
					</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="5">No matching content found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
