<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import { to_content_edit_path, to_content_public_href } from '#lib/admin/content_links.ts';
	import AdminConfirmDialog from '#lib/admin/AdminConfirmDialog.svelte';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminDateRange from '#lib/admin/AdminDateRange.svelte';
	import AdminFilterMenu from '#lib/admin/AdminFilterMenu.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import MultiSelect from '#lib/admin/MultiSelect.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
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
		assign_content_tags,
		bulk_delete_content,
		bulk_update_status,
		get_tag_options,
		remove_content_tags,
		list_content
	} from './admin_content.remote';

	const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const TYPES = ['PODCAST', 'ARTICLE', 'VIDEO', 'TOOL', 'NEWSLETTER', 'EVENT'] as const;
	const FILTER_KEYS = ['q', 'status', 'type', 'date_from', 'date_to', 'tag_id'] as const;
	const PAGE_SIZE = 25;

	const STATUS_FILTER_OPTIONS = to_filter_options(STATUSES, { include_all: true });
	const TYPE_FILTER_OPTIONS = to_filter_options(TYPES, { include_all: true });
	const BULK_STATUS_OPTIONS = to_filter_options(STATUSES);

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist(current_page.url.searchParams, 'status', ['', ...STATUSES] as const, '')
	);
	let type_filter = $derived(
		read_picklist(current_page.url.searchParams, 'type', ['', ...TYPES] as const, '')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let tag_id = $derived(read_string(current_page.url.searchParams, 'tag_id'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
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

	// The list's query, also used to refresh it after a bulk action
	let list_query = $derived<Parameters<typeof list_content>[0]>({
		search_text,
		status: status_filter || 'ALL',
		type: type_filter || 'ALL',
		date_from_iso: date_from || undefined,
		date_to_iso: date_to || undefined,
		tag_id: tag_id || undefined,
		page: page_number,
		page_size: PAGE_SIZE
	});

	let list_result = $derived(await list_content(list_query));

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replace: true,
			reset: false
		});
	}

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	async function run_bulk_status_update(value: string) {
		const status = STATUSES.find((known_status) => known_status === value);
		if (!status) return;

		if (selected_content_ids.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		clear_feedback();
		busy = true;

		try {
			const result = await bulk_update_status({
				content_ids: selected_content_ids,
				status
			});
			action_message = `Set ${result.count} item(s) to ${humanize_enum(status)}.`;
			selected_content_ids = [];
			await list_content(list_query).refresh();
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
		busy = true;

		try {
			const result = await bulk_delete_content({
				content_ids: selected_content_ids,
				confirm_text: 'DELETE'
			});

			action_message = `Deleted ${result.deleted_count} item(s). Skipped ${result.skipped_count} unsupported Content item(s).`;
			selected_content_ids = [];
			await list_content(list_query).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to delete selected rows. Please try again.';
			throw error;
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
			await list_content(list_query).refresh();
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
			await list_content(list_query).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to remove tags from selected rows. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Content | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<AdminList
		total={list_result.total}
		page={list_result.page}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids={selected_content_ids}
		visible_ids={list_result.items.map((item) => item.id)}
		{busy}
		message={action_message}
		error={action_error}
		clear_href={show_clear_filters ? resolve('admin/content') : null}
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
				label="Type"
				value={type_filter}
				options={TYPE_FILTER_OPTIONS}
				onselect={(value) => update_url({ type: value || null, page: null })}
			/>
			{#if tag_id}
				<a
					class="button"
					data-intent="quiet"
					href={build_url(current_page.url, { tag_id: null, page: null })}
				>
					× Tag{active_tag_name ? `: ${active_tag_name}` : ''}
				</a>
			{/if}
		{/snippet}

		{#snippet bulk()}
			<MultiSelect
				options={bulk_tag_options}
				bind:selected_ids={bulk_selected_tag_ids}
				label="Tags"
				placeholder="Search tags"
			/>
			{#if bulk_selected_tag_ids.length > 0}
				<button type="button" onclick={run_bulk_add_tags} disabled={busy}>Add tags</button>
				<button type="button" onclick={run_bulk_remove_tags} disabled={busy}>Remove tags</button>
			{/if}
			<AdminFilterMenu
				label="Set status"
				options={BULK_STATUS_OPTIONS}
				disabled={busy}
				onselect={run_bulk_status_update}
			/>
			<AdminConfirmDialog
				title="Delete selected content?"
				description="Selected Articles will be permanently deleted. Other content is skipped: archive Videos instead, since the YouTube sync would bring them back."
				action_label="Delete"
				onconfirm={run_bulk_delete}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Title</th>
			<th>Status</th>
			<th>Type</th>
			<th>Published</th>
		{/snippet}

		{#snippet table_body({ select_cell })}
			{#each list_result.items as content_row (content_row.id)}
				{@const edit_path = to_content_edit_path(content_row)}
				<tr>
					{@render select_cell(content_row.id, content_row.title)}
					<AdminTitleCell
						title={content_row.title}
						edit_href={edit_path ? resolve(edit_path) : null}
						public_href={to_content_public_href(content_row)}
					/>
					<td><StatusBadge status={content_row.status} /></td>
					<td class="admin-cell-muted">{humanize_enum(content_row.type)}</td>
					<AdminDateCell value={content_row.published_at} show_time />
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
