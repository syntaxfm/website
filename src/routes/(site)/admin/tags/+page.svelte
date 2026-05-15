<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { build_url, has_any_filter, read_int, read_string } from '$lib/admin/admin_filters';
	import { create_tag, delete_tag, list_tags, update_tag } from './admin_tags.remote';

	const FILTER_KEYS = ['q'] as const;
	const PAGE_SIZE = 25;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let new_name = $state('');
	let new_slug = $state('');
	let creating = $state(false);

	let draft_by_id = $state<Record<string, { name: string; slug: string }>>({});
	let row_busy = $state<Record<string, boolean>>({});

	let action_message = $state('');
	let action_error = $state('');

	type TagListResult = Awaited<ReturnType<typeof list_tags>>;
	type TagListItem = TagListResult['items'][number];

	function get_list_tags_query() {
		return list_tags({
			search_text,
			page: page_number,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_tags_query());

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function on_search_input(next_value: string) {
		update_url({ q: next_value || null, page: null });
	}

	function on_page_change(next_page: number) {
		update_url({ page: next_page > 1 ? next_page : null });
	}

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	function set_row_busy(tag_id: string, busy: boolean) {
		row_busy = {
			...row_busy,
			[tag_id]: busy
		};
	}

	function get_draft(row: TagListItem) {
		return draft_by_id[row.id] ?? { name: row.name, slug: row.slug };
	}

	function set_draft(tag_id: string, draft: { name: string; slug: string }) {
		draft_by_id = {
			...draft_by_id,
			[tag_id]: draft
		};
	}

	function clear_draft(tag_id: string) {
		const { [tag_id]: _removed, ...rest } = draft_by_id;
		draft_by_id = rest;
	}

	async function create_new_tag(event: SubmitEvent) {
		event.preventDefault();
		const trimmed_name = new_name.trim();
		if (!trimmed_name) {
			action_error = 'Tag name is required.';
			return;
		}

		creating = true;
		clear_feedback();

		try {
			await create_tag({
				name: trimmed_name,
				slug: new_slug.trim() || undefined
			});
			new_name = '';
			new_slug = '';
			action_message = 'Tag created.';
			await get_list_tags_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = error instanceof Error ? error.message : 'Unable to create tag.';
		} finally {
			creating = false;
		}
	}

	async function save_tag(row: TagListItem) {
		const draft = get_draft(row);
		const trimmed_name = draft.name.trim();

		if (!trimmed_name) {
			action_error = 'Tag name is required.';
			return;
		}

		set_row_busy(row.id, true);
		clear_feedback();

		try {
			await update_tag({
				id: row.id,
				name: trimmed_name,
				slug: draft.slug.trim() || undefined
			});
			action_message = 'Tag updated.';
			clear_draft(row.id);
			await get_list_tags_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = error instanceof Error ? error.message : 'Unable to update tag.';
		} finally {
			set_row_busy(row.id, false);
		}
	}

	async function remove_tag(row: TagListItem) {
		if (!window.confirm(`Delete tag "${row.name}"? This cannot be undone.`)) {
			return;
		}

		set_row_busy(row.id, true);
		clear_feedback();

		try {
			await delete_tag(row.id);
			action_message = 'Tag deleted.';
			clear_draft(row.id);
			await get_list_tags_query().refresh();
		} catch (error) {
			console.error(error);
			action_error = error instanceof Error ? error.message : 'Unable to delete tag.';
		} finally {
			set_row_busy(row.id, false);
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Tags</h1>

	<div class="bg-shade-or-tint-light br-small" style="padding: var(--pad-medium)">
		<div class="stack" style:--stack-gap="var(--pad-small)">
			<span class="fs-2 fv-700">Create Tag</span>
			<form class="flex" style="flex-wrap: wrap" style:--flex-gap="var(--pad-small)" onsubmit={create_new_tag}>
				<label class="stack" style:--stack-gap="0.35rem">
					<span class="fs-2">Name</span>
					<input type="text" bind:value={new_name} placeholder="JavaScript" required />
				</label>
				<label class="stack" style:--stack-gap="0.35rem">
					<span class="fs-2">Slug (optional)</span>
					<input type="text" bind:value={new_slug} placeholder="javascript" />
				</label>
				<button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Tag'}</button>
			</form>
		</div>
	</div>

	{#await list_result_promise}
		<p class="fs-2">Loading tags...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			{visible_ids}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch text={search_text} on_input={on_search_input} placeholder="Search tags" />
					{#if show_clear_filters}
						<div>
							<a class="button small" href="/admin/tags">× Clear</a>
						</div>
					{/if}
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

			{#snippet table_head(_params)}
				<th>Name</th>
				<th>Slug</th>
				<th class="center">Usage count</th>
				<th>Actions</th>
			{/snippet}

			{#snippet table_body(_params)}
				{#each list_items as row (row.id)}
					{@const draft = get_draft(row)}
					<tr>
						<td>
							<input
								type="text"
								value={draft.name}
								oninput={(event) => {
									const target = event.currentTarget;
									if (!(target instanceof HTMLInputElement)) return;
									set_draft(row.id, { ...draft, name: target.value });
								}}
							/>
						</td>
						<td>
							<input
								type="text"
								value={draft.slug}
								oninput={(event) => {
									const target = event.currentTarget;
									if (!(target instanceof HTMLInputElement)) return;
									set_draft(row.id, { ...draft, slug: target.value });
								}}
							/>
						</td>
						<td class="center">{row.content_count}</td>
						<td>
							<div class="flex" style:--flex-gap="var(--pad-xsmall)">
								<button
									class="small"
									type="button"
									onclick={() => save_tag(row)}
									disabled={row_busy[row.id]}
								>
									Save
								</button>
								<button
									class="small delete-btn"
									type="button"
									onclick={() => remove_tag(row)}
									disabled={row_busy[row.id]}
								>
									Delete
								</button>
							</div>
						</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="4">No tags found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load tags. Please try again.</p>
	{/await}
</div>

<style lang="postcss">
	td input {
		width: 100%;
		background: transparent;
		border: 1px solid var(--c-fg-1);
		padding: 4px 8px;
		font-size: var(--fs-2);
		color: var(--c-fg);
		border-radius: var(--br-small);
	}

	td input:focus {
		border-color: var(--c-primary);
		outline: none;
	}

	.center {
		text-align: center;
	}

	.delete-btn {
		background: transparent;
		color: var(--c-fg);
		border: 1px solid var(--c-fg-1);
	}

	.delete-btn:hover {
		background: var(--c-red);
		color: white;
		border-color: var(--c-red);
	}
</style>
