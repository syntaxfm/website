<script lang="ts">
	import { format } from 'date-fns';
	import { page as current_page } from '$app/state';
	import { createUseQueryParams } from 'svelte-query-params';
	import { sveltekit } from 'svelte-query-params/adapters/sveltekit';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
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
	const PAGE_SIZE = 25;

	type ContentStatusFilter = (typeof STATUS_FILTERS)[number];
	type ContentTypeFilter = (typeof TYPE_FILTERS)[number];
	type ContentStatus = (typeof BULK_STATUSES)[number];

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
			status: picklist<ContentStatusFilter>(STATUS_FILTERS, 'ALL'),
			type: picklist<ContentTypeFilter>(TYPE_FILTERS, 'ALL'),
			date_from: string_default(''),
			date_to: string_default(''),
			page: page_int,
			bulk_status: picklist<ContentStatus>(BULK_STATUSES, 'DRAFT')
		},
		{
			adapter: sveltekit({ replace: true }),
			debounce: 250
		}
	);

	const [params, helpers] = use_params(current_page.url);

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const TYPE_FILTER_OPTIONS = TYPE_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));
	const BULK_STATUS_OPTIONS = BULK_STATUSES.map((value) => ({ value, label: value }));

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

	let url_q = $derived(current_page.url.searchParams.get('q') ?? '');
	let url_status = $derived(
		(current_page.url.searchParams.get('status') as ContentStatusFilter | null) ?? 'ALL'
	);
	let url_type = $derived(
		(current_page.url.searchParams.get('type') as ContentTypeFilter | null) ?? 'ALL'
	);
	let url_date_from = $derived(current_page.url.searchParams.get('date_from') ?? '');
	let url_date_to = $derived(current_page.url.searchParams.get('date_to') ?? '');
	let url_page = $derived(page_int(current_page.url.searchParams.get('page') ?? undefined));

	let show_clear_filters = $derived(
		url_q !== '' ||
			url_status !== 'ALL' ||
			url_type !== 'ALL' ||
			url_date_from !== '' ||
			url_date_to !== ''
	);

	function get_list_content_query() {
		return list_content({
			search_text: url_q,
			status: url_status,
			type: url_type,
			date_from_iso: url_date_from || undefined,
			date_to_iso: url_date_to || undefined,
			page: url_page,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_content_query());

	function on_page_change(next_page: number) {
		helpers.update({ page: next_page });
	}

	function on_status_select(next_value: string) {
		const fallback: ContentStatusFilter = 'ALL';
		const next = (next_value || fallback) as ContentStatusFilter;
		helpers.update({ status: next, page: 1 });
	}

	function on_type_select(next_value: string) {
		const fallback: ContentTypeFilter = 'ALL';
		const next = (next_value || fallback) as ContentTypeFilter;
		helpers.update({ type: next, page: 1 });
	}

	function on_bulk_status_select(next_value: string) {
		const next = (next_value || 'DRAFT') as ContentStatus;
		helpers.update({ bulk_status: next });
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
				status: params.bulk_status
			});
			action_message = `Updated ${result.count} item(s) to ${params.bulk_status}.`;
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

	{#await list_result_promise}
		<p class="fs-2">Loading content...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			bind:selected_ids={selected_content_ids}
			{visible_ids}
			{busy}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch bind:text={params.q} />
					<div
						class="flex"
						style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
					>
						<SelectMenu
							popover_id="filter-status"
							button_text={`Status ${params.status !== 'ALL' ? `(${params.status})` : ''}`}
							button_icon={'filter' as any}
							value={params.status === 'ALL' ? '' : params.status}
							options={STATUS_FILTER_OPTIONS}
							onselect={on_status_select}
						/>
						<SelectMenu
							popover_id="filter-type"
							button_text={`Type ${params.type !== 'ALL' ? `(${params.type})` : ''}`}
							button_icon={'filter' as any}
							value={params.type === 'ALL' ? '' : params.type}
							options={TYPE_FILTER_OPTIONS}
							onselect={on_type_select}
						/>
						<label class="stack" style="--stack-gap: 2px">
							<span class="fs-1">From</span>
							<input type="date" bind:value={params.date_from} />
						</label>
						<label class="stack" style="--stack-gap: 2px">
							<span class="fs-1">To</span>
							<input type="date" bind:value={params.date_to} />
						</label>
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
						aria-label="Select all rows on this page"
						checked={all_visible_selected}
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
				{#each list_items as content_row (content_row.id)}
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
						<td>{content_row.status}</td>
						<td>{content_row.type}</td>
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
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load content. Please try again.</p>
	{/await}
</div>
