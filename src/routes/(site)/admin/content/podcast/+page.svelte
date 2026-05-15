<script lang="ts">
	import { format } from 'date-fns';
	import { page as current_page } from '$app/state';
	import { createUseQueryParams } from 'svelte-query-params';
	import { sveltekit } from 'svelte-query-params/adapters/sveltekit';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import RemoteFormButton from '$lib/forms/RemoteFormButton.svelte';
	import {
		bulk_update_show_status,
		import_all_shows,
		list_shows,
		refresh_all
	} from './admin_podcast.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const BULK_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const PAGE_SIZE = 25;

	type ShowStatusFilter = (typeof STATUS_FILTERS)[number];
	type ShowStatus = (typeof BULK_STATUSES)[number];

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
			status: picklist<ShowStatusFilter>(STATUS_FILTERS, 'ALL'),
			date_from: string_default(''),
			date_to: string_default(''),
			page: page_int,
			bulk_status: picklist<ShowStatus>(BULK_STATUSES, 'DRAFT')
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
	const BULK_STATUS_OPTIONS = BULK_STATUSES.map((value) => ({ value, label: value }));

	let selected_show_numbers = $state<string[]>([]);
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	type ShowListResult = Awaited<ReturnType<typeof list_shows>>;
	type ShowListItem = ShowListResult['items'][number];

	let url_q = $derived(current_page.url.searchParams.get('q') ?? '');
	let url_status = $derived(
		(current_page.url.searchParams.get('status') as ShowStatusFilter | null) ?? 'ALL'
	);
	let url_date_from = $derived(current_page.url.searchParams.get('date_from') ?? '');
	let url_date_to = $derived(current_page.url.searchParams.get('date_to') ?? '');
	let url_page = $derived(page_int(current_page.url.searchParams.get('page') ?? undefined));

	let show_clear_filters = $derived(
		url_q !== '' || url_status !== 'ALL' || url_date_from !== '' || url_date_to !== ''
	);

	function get_list_shows_query() {
		return list_shows({
			search_text: url_q,
			status: url_status,
			date_from_iso: url_date_from || undefined,
			date_to_iso: url_date_to || undefined,
			page: url_page,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_shows_query());

	function on_page_change(next_page: number) {
		helpers.update({ page: next_page });
	}

	function on_status_select(next_value: string) {
		const fallback: ShowStatusFilter = 'ALL';
		const next = (next_value || fallback) as ShowStatusFilter;
		helpers.update({ status: next, page: 1 });
	}

	function on_bulk_status_select(next_value: string) {
		const next = (next_value || 'DRAFT') as ShowStatus;
		helpers.update({ bulk_status: next });
	}

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	async function run_bulk_status_update() {
		if (selected_show_numbers.length === 0) {
			action_error = 'Select at least one row first.';
			return;
		}

		clear_feedback();
		busy = true;

		try {
			const show_numbers = selected_show_numbers
				.map((id) => Number.parseInt(id, 10))
				.filter((value) => Number.isFinite(value));

			const result = await bulk_update_show_status({
				show_numbers,
				status: params.bulk_status
			});

			const skipped_suffix =
				result.skipped_count > 0 ? ` Skipped ${result.skipped_count} unlinked show(s).` : '';
			action_message = `Updated ${result.count} show(s) to ${params.bulk_status}.${skipped_suffix}`;
			selected_show_numbers = [];
			await get_list_shows_query().refresh();
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

	{#await list_result_promise}
		<p class="fs-2">Loading shows...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => String(item.number))}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			bind:selected_ids={selected_show_numbers}
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
						<label class="stack" style="--stack-gap: 2px">
							<span class="fs-1">From</span>
							<input type="date" bind:value={params.date_from} />
						</label>
						<label class="stack" style="--stack-gap: 2px">
							<span class="fs-1">To</span>
							<input type="date" bind:value={params.date_to} />
						</label>
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
						button_text={`Bulk status (${params.bulk_status})`}
						button_icon={'filter' as any}
						value={params.bulk_status}
						options={BULK_STATUS_OPTIONS}
						onselect={on_bulk_status_select}
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
				<th>Number</th>
				<th>Title</th>
				<th>Status</th>
				<th>Date</th>
				<th>Show type</th>
			{/snippet}

			{#snippet table_body({ toggle_selected, is_selected })}
				{#each list_items as show_row (show_row.number)}
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
						<td>{show_row.meta ? show_row.meta.status : '-'}</td>
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
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load shows. Please try again.</p>
	{/await}
</div>
