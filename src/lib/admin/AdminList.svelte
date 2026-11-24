<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminTable from './AdminTable.svelte';

	type TableBodyParams = {
		// The row's checkbox cell; only lists with bulk actions render it
		select_cell: Snippet<[id: string, label: string]>;
	};

	type Props = {
		total: number;
		page?: number;
		total_pages?: number;
		on_page_change?: (next_page: number) => void;
		selected_ids?: string[];
		visible_ids: string[];
		busy?: boolean;
		// What the last action did, or why it failed
		message?: string;
		error?: string;
		// The filter controls; the list lays them out in one row
		filters?: Snippet;
		// Where "× Clear" goes while any filter is set
		clear_href?: string | null;
		// Actions for the selected rows. Giving it adds the checkbox column.
		bulk?: Snippet;
		table_head: Snippet;
		table_body: Snippet<[TableBodyParams]>;
		empty?: Snippet;
	};

	let {
		total,
		page = 1,
		total_pages = 1,
		on_page_change,
		selected_ids = $bindable<string[]>([]),
		visible_ids,
		busy = false,
		message = '',
		error = '',
		filters,
		clear_href,
		bulk,
		table_head,
		table_body,
		empty
	}: Props = $props();

	let all_visible_selected = $derived(
		visible_ids.length > 0 && visible_ids.every((id) => selected_ids.includes(id))
	);

	// Partial selection drives the header checkbox's indeterminate state.
	let indeterminate = $derived(
		!all_visible_selected && visible_ids.some((id) => selected_ids.includes(id))
	);

	let is_selecting = $derived(selected_ids.length > 0 && Boolean(bulk));

	function toggle_selected(id: string, checked: boolean) {
		if (checked) {
			if (!selected_ids.includes(id)) {
				selected_ids = [...selected_ids, id];
			}
			return;
		}

		selected_ids = selected_ids.filter((existing_id) => existing_id !== id);
	}

	function toggle_all_visible(checked: boolean) {
		if (!checked) {
			selected_ids = selected_ids.filter((existing_id) => !visible_ids.includes(existing_id));
			return;
		}

		selected_ids = [
			...selected_ids,
			...visible_ids.filter((visible_id) => !selected_ids.includes(visible_id))
		];
	}

	function go_to_page(next_page: number) {
		if (busy || next_page < 1 || next_page > total_pages) return;
		on_page_change?.(next_page);
	}
</script>

{#snippet select_cell(id: string, label: string)}
	<td>
		<input
			type="checkbox"
			aria-label={`Select ${label}`}
			checked={selected_ids.includes(id)}
			onchange={(event) => toggle_selected(id, event.currentTarget.checked)}
		/>
	</td>
{/snippet}

{#snippet pager()}
	<nav class="admin-list-pagination" aria-label="Pagination">
		<p>Page {page} of {total_pages}</p>
		<button
			type="button"
			onclick={() => go_to_page(page - 1)}
			disabled={page <= 1 || busy}
			aria-label="Previous page">←</button
		>
		<button
			type="button"
			onclick={() => go_to_page(page + 1)}
			disabled={page >= total_pages || busy}
			aria-label="Next page">→</button
		>
	</nav>
{/snippet}

<div class="admin-list stack">
	{#if filters}
		<div class="admin-filters">
			{@render filters()}
			{#if clear_href}
				<a class="button" data-intent="quiet" href={clear_href}>× Clear</a>
			{/if}
		</div>
	{/if}

	<!-- One row that swaps between the count and the bulk actions, so selecting never moves the table -->
	<div
		class="admin-list-meta"
		data-selecting={is_selecting}
		role={is_selecting ? 'group' : undefined}
		aria-label={is_selecting ? 'Bulk actions' : undefined}
	>
		{#if is_selecting && bulk}
			<button
				type="button"
				data-intent="quiet"
				onclick={() => (selected_ids = [])}
				aria-label="Clear selection">×</button
			>
			<strong>{selected_ids.length} selected</strong>
			{@render bulk()}
		{:else}
			<p class="admin-list-count">
				{total.toLocaleString()}
				{total === 1 ? 'item' : 'items'}
			</p>
			{#if message}
				<p class="admin-feedback" data-tone="positive" role="status">{message}</p>
			{/if}
			{#if error}
				<p class="admin-feedback" data-tone="negative" role="alert">{error}</p>
			{/if}
			{#if total_pages > 1}
				{@render pager()}
			{/if}
		{/if}
	</div>

	<AdminTable is_empty={visible_ids.length === 0} {empty}>
		{#snippet head()}
			{#if bulk}
				<!-- The words show only on phones, where the column headers are gone -->
				<th>
					<label class="admin-select-all">
						<input
							type="checkbox"
							checked={all_visible_selected}
							{indeterminate}
							onchange={(event) => toggle_all_visible(event.currentTarget.checked)}
						/>
						<span>Select all on this page</span>
					</label>
				</th>
			{/if}
			{@render table_head()}
		{/snippet}
		{@render table_body({ select_cell })}
	</AdminTable>

	{#if total_pages > 1}
		<div class="admin-list-meta">
			{@render pager()}
		</div>
	{/if}
</div>
