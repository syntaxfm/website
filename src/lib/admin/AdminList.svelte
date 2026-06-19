<script lang="ts">
	import type { Snippet } from 'svelte';

	type TableHeadParams = {
		all_visible_selected: boolean;
		indeterminate: boolean;
		toggle_all_visible: (checked: boolean) => void;
	};

	type TableBodyParams = {
		toggle_selected: (id: string, checked: boolean) => void;
		is_selected: (id: string) => boolean;
	};

	type Props = {
		total: number;
		page: number;
		page_size: number;
		total_pages: number;
		on_page_change: (next_page: number) => void;
		selected_ids?: string[];
		visible_ids: string[];
		busy?: boolean;
		filters?: Snippet;
		bulk?: Snippet;
		table_head: Snippet<[TableHeadParams]>;
		table_body: Snippet<[TableBodyParams]>;
		empty?: Snippet;
		action_feedback?: Snippet;
	};

	let {
		total,
		page,
		page_size: _page_size,
		total_pages,
		on_page_change,
		selected_ids = $bindable<string[]>([]),
		visible_ids,
		busy = false,
		filters,
		bulk,
		table_head,
		table_body,
		empty,
		action_feedback
	}: Props = $props();

	let all_visible_selected = $derived(
		visible_ids.length > 0 && visible_ids.every((id) => selected_ids.includes(id))
	);

	// Partial selection drives the header checkbox's indeterminate state.
	let indeterminate = $derived(
		!all_visible_selected && visible_ids.some((id) => selected_ids.includes(id))
	);

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

		const merged = new Set(selected_ids);
		for (const id of visible_ids) {
			merged.add(id);
		}
		selected_ids = Array.from(merged);
	}

	function is_selected(id: string): boolean {
		return selected_ids.includes(id);
	}

	function go_previous() {
		if (page <= 1 || busy) {
			return;
		}

		on_page_change(page - 1);
	}

	function go_next() {
		if (page >= total_pages || busy) {
			return;
		}

		on_page_change(page + 1);
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	{#if filters}
		{@render filters()}
	{/if}

	{#if selected_ids.length > 0 && bulk}
		<div
			class="stack bg-shade-or-tint-light br-small"
			style="padding: var(--pad-small); --stack-gap: var(--pad-small)"
			aria-label="Bulk actions"
		>
			<div class="split" style:--split-gap="var(--pad-small)">
				<span class="fs-2 fv-700">Bulk Actions</span>
				<span class="fs-2 primary">{selected_ids.length} selected</span>
			</div>
			{@render bulk()}
		</div>
	{/if}

	{#if action_feedback}
		{@render action_feedback()}
	{/if}

	{#snippet pager()}
		<div class="split" style:--split-gap="var(--pad-small)" aria-label="Pagination controls">
			<button type="button" onclick={go_previous} disabled={page <= 1 || busy}>Previous</button>
			<p class="fs-2">Page {page} of {total_pages} ({total} total)</p>
			<button type="button" onclick={go_next} disabled={page >= total_pages || busy}>Next</button>
		</div>
	{/snippet}

	{#if total_pages > 1}
		{@render pager()}
	{:else}
		<p class="fs-1">{total} {total === 1 ? 'item' : 'items'}</p>
	{/if}

	<div class="table-container">
		<table>
			<thead>
				<tr>
					{@render table_head({ all_visible_selected, indeterminate, toggle_all_visible })}
				</tr>
			</thead>
			<tbody>
				{#if visible_ids.length === 0}
					{#if empty}
						{@render empty()}
					{:else}
						<tr>
							<td>No items found.</td>
						</tr>
					{/if}
				{:else}
					{@render table_body({ toggle_selected, is_selected })}
				{/if}
			</tbody>
		</table>
	</div>

	{#if total_pages > 1}
		{@render pager()}
	{/if}
</div>
