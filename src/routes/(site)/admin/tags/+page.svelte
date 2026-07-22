<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import AdminConfirmDialog from '$lib/admin/AdminConfirmDialog.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { build_url, has_any_filter, read_int, read_string } from '$lib/admin/admin_filters';
	import AdminSearch from '../AdminSearch.svelte';
	import { create_tag, delete_tag, list_tags, update_tag } from './admin_tags.remote';

	const FILTER_KEYS = ['q'] as const;
	const PAGE_SIZE = 25;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let new_name = $state('');
	let creating = $state(false);

	let draft_by_id = $state<Record<string, { name: string }>>({});
	let row_busy = $state<Record<string, boolean>>({});

	let action_message = $state('');
	let action_error = $state('');

	type TagListResult = Awaited<ReturnType<typeof list_tags>>;
	type TagListItem = TagListResult['items'][number];

	const list_result = $derived(
		await list_tags({
			search_text,
			page: page_number,
			page_size: PAGE_SIZE
		})
	);

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

	function set_row_busy(tag_id: string, busy: boolean) {
		row_busy = {
			...row_busy,
			[tag_id]: busy
		};
	}

	function get_draft(row: TagListItem) {
		return draft_by_id[row.id] ?? { name: row.name };
	}

	function set_draft(tag_id: string, draft: { name: string }) {
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
			await create_tag({ name: trimmed_name });
			new_name = '';
			action_message = 'Tag created.';
			await list_tags({
				search_text,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error('Unable to create tag', error);
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
				name: trimmed_name
			});
			action_message = 'Tag updated.';
			clear_draft(row.id);
			await list_tags({
				search_text,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error('Unable to update tag', error);
			action_error = error instanceof Error ? error.message : 'Unable to update tag.';
		} finally {
			set_row_busy(row.id, false);
		}
	}

	async function remove_tag(row: TagListItem) {
		set_row_busy(row.id, true);
		clear_feedback();

		try {
			await delete_tag(row.id);
			action_message = 'Tag deleted.';
			clear_draft(row.id);
			await list_tags({
				search_text,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error('Unable to delete tag', error);
			action_error = error instanceof Error ? error.message : 'Unable to delete tag.';
			throw error;
		} finally {
			set_row_busy(row.id, false);
		}
	}
</script>

<svelte:head>
	<title>Tags | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<form class="admin-inline-form admin-actions" onsubmit={create_new_tag}>
		<label class="admin-visually-hidden" for="new-tag-name">Tag name</label>
		<input
			id="new-tag-name"
			type="text"
			bind:value={new_name}
			placeholder="New tag name"
			required
			disabled={creating}
		/>
		<button type="submit" data-intent="primary" disabled={creating}>
			{creating ? 'Creating…' : 'Create tag'}
		</button>
	</form>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		visible_ids={list_result.items.map((item) => item.id)}
	>
		{#snippet filters()}
			<div class="admin-field">
				<AdminSearch
					text={search_text}
					on_input={(value) => update_url({ q: value || null, page: null })}
					placeholder="Search tags"
				/>
				{#if show_clear_filters}
					<div class="admin-control-row">
						<a class="button" data-intent="quiet" href={resolve('/admin/tags')}>× Clear</a>
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet action_feedback()}
			{#if action_message}
				<p class="admin-feedback" data-tone="positive" role="status">{action_message}</p>
			{/if}
			{#if action_error}
				<p class="admin-feedback" data-tone="negative" role="alert">{action_error}</p>
			{/if}
		{/snippet}

		{#snippet table_head(_params)}
			<th>Name</th>
			<th>Slug</th>
			<th>Usage count</th>
			<th>Actions</th>
		{/snippet}

		{#snippet table_body(_params)}
			{#each list_result.items as row (row.id)}
				{@const draft = get_draft(row)}
				<tr>
					<td>
						<input
							aria-label={`Rename ${row.name}`}
							type="text"
							value={draft.name}
							disabled={row_busy[row.id]}
							oninput={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								set_draft(row.id, { name: target.value });
							}}
						/>
					</td>
					<td>/{row.slug}</td>
					<td><a href={resolve(`/admin/tags/${row.id}`)}>{row.content_count}</a></td>
					<td>
						<div class="admin-control-row">
							<button
								type="button"
								data-intent="primary"
								onclick={() => save_tag(row)}
								disabled={row_busy[row.id]}
							>
								{row_busy[row.id] ? 'Saving…' : 'Save'}
							</button>
							<AdminConfirmDialog
								title={`Delete ${row.name}?`}
								description="This permanently deletes the tag and cannot be undone."
								action_label="Delete tag"
								trigger_label="Delete"
								onconfirm={() => remove_tag(row)}
							/>
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
</div>
