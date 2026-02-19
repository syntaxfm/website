<script lang="ts">
	import { create_tag, delete_tag, list_tags, update_tag } from './admin_tags.remote';

	interface TagRow {
		id: string;
		name: string;
		slug: string;
		content_count: number;
	}

	let new_name = $state('');
	let new_slug = $state('');
	let creating = $state(false);
	let loading = $state(false);

	let rows = $state<TagRow[]>([]);
	let draft_by_id = $state<Record<string, { name: string; slug: string }>>({});
	let row_busy = $state<Record<string, boolean>>({});

	let status_message = $state('');
	let status_error = $state('');

	let search_text = $state('');

	let filtered_rows = $derived(
		search_text.trim() === ''
			? rows
			: rows.filter((row) => {
					const query = search_text.toLowerCase();
					return row.name.toLowerCase().includes(query) || row.slug.toLowerCase().includes(query);
				})
	);

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	function set_row_busy(tag_id: string, busy: boolean) {
		row_busy = {
			...row_busy,
			[tag_id]: busy
		};
	}

	function get_draft(tag_id: string) {
		return draft_by_id[tag_id] || { name: '', slug: '' };
	}

	function set_draft(tag_id: string, draft: { name: string; slug: string }) {
		draft_by_id = {
			...draft_by_id,
			[tag_id]: draft
		};
	}

	async function load_rows() {
		loading = true;
		clear_feedback();

		try {
			const result = (await list_tags()) as TagRow[];
			rows = result;
			draft_by_id = Object.fromEntries(
				result.map((row) => [row.id, { name: row.name, slug: row.slug }])
			);
		} catch (error) {
			console.error(error);
			status_error = 'Unable to load tags.';
		} finally {
			loading = false;
		}
	}

	await load_rows();

	async function create_new_tag() {
		const trimmed_name = new_name.trim();
		if (!trimmed_name) {
			status_error = 'Tag name is required.';
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
			status_message = 'Tag created.';
			await load_rows();
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to create tag.';
		} finally {
			creating = false;
		}
	}

	async function save_tag(tag_id: string) {
		const draft = get_draft(tag_id);
		const trimmed_name = draft.name.trim();

		if (!trimmed_name) {
			status_error = 'Tag name is required.';
			return;
		}

		set_row_busy(tag_id, true);
		clear_feedback();

		try {
			await update_tag({
				id: tag_id,
				name: trimmed_name,
				slug: draft.slug.trim() || undefined
			});
			status_message = 'Tag updated.';
			await load_rows();
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to update tag.';
		} finally {
			set_row_busy(tag_id, false);
		}
	}

	async function remove_tag(tag_id: string) {
		const tag = rows.find((r) => r.id === tag_id);
		const tag_name = tag ? tag.name : 'this tag';
		if (!window.confirm(`Delete tag "${tag_name}"? This cannot be undone.`)) {
			return;
		}

		set_row_busy(tag_id, true);
		clear_feedback();

		try {
			await delete_tag(tag_id);
			status_message = 'Tag deleted.';
			await load_rows();
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to delete tag.';
		} finally {
			set_row_busy(tag_id, false);
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Tags</h1>
		<span class="fs-2">{filtered_rows.length} of {rows.length} tags</span>
	</div>

	<div class="bg-shade-or-tint-light br-small" style="padding: var(--pad-medium)">
		<div class="stack" style:--stack-gap="var(--pad-small)">
			<span class="fs-2 fv-700">Create New Tag</span>
			<form
				class="flex"
				style:--flex-gap="var(--pad-small)"
				onsubmit={(event) => {
					event.preventDefault();
					void create_new_tag();
				}}
			>
				<label class="stack" style:--stack-gap="0.35rem">
					<span class="fs-2">Name</span>
					<input type="text" bind:value={new_name} placeholder="JavaScript" required />
				</label>
				<label class="stack" style:--stack-gap="0.35rem">
					<span class="fs-2">Slug (optional)</span>
					<input type="text" bind:value={new_slug} placeholder="javascript" />
				</label>
				<button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create tag'}</button>
			</form>
		</div>
	</div>

	{#if status_message}
		<p class="fs-2" style="color: var(--c-green)">{status_message}</p>
	{/if}

	{#if status_error}
		<p class="fs-2" style="color: var(--c-red)">{status_error}</p>
	{/if}

	<input type="text" bind:value={search_text} placeholder="Filter tags..." class="search-input" />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Slug</th>
					<th class="center">Usage count</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan="4">Loading tags...</td>
					</tr>
				{:else if filtered_rows.length === 0}
					<tr>
						<td colspan="4">No tags found.</td>
					</tr>
				{:else}
					{#each filtered_rows as row (row.id)}
						<tr>
							<td>
								<input
									type="text"
									value={get_draft(row.id).name}
									oninput={(event) => {
										const target = event.currentTarget;
										if (!(target instanceof HTMLInputElement)) {
											return;
										}

										set_draft(row.id, {
											...get_draft(row.id),
											name: target.value
										});
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={get_draft(row.id).slug}
									oninput={(event) => {
										const target = event.currentTarget;
										if (!(target instanceof HTMLInputElement)) {
											return;
										}

										set_draft(row.id, {
											...get_draft(row.id),
											slug: target.value
										});
									}}
								/>
							</td>
							<td class="center">{row.content_count}</td>
							<td>
								<div class="flex" style:--flex-gap="var(--pad-xsmall)">
									<button
										class="small"
										type="button"
										onclick={() => save_tag(row.id)}
										disabled={row_busy[row.id]}
									>
										Save
									</button>
									<button
										class="small delete-btn"
										type="button"
										onclick={() => remove_tag(row.id)}
										disabled={row_busy[row.id]}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style lang="postcss">
	.search-input {
		width: 100%;
		background: transparent;
		border: var(--border);
		padding: 10px;
		font-size: var(--font-size-base);
		color: var(--c-fg);
		border-radius: var(--br-medium);
	}

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
