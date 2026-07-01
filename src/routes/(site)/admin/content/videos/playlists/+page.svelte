<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminActions from '../../../AdminActions.svelte';
	import AdminSearch from '../../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { build_url, has_any_filter, read_int, read_string } from '$lib/admin/admin_filters';
	import { create_playlist, list_playlists } from './admin_playlists.remote';

	const FILTER_KEYS = ['q'] as const;
	const PAGE_SIZE = 25;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let new_playlist_title = $state('');
	let creating = $state(false);
	let create_error = $state('');

	const list_result = await list_playlists({
		search_text,
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

	async function create_new_playlist(event: Event) {
		event.preventDefault();
		create_error = '';

		const trimmed_title = new_playlist_title.trim();
		if (!trimmed_title) {
			create_error = 'Title is required.';
			return;
		}

		creating = true;

		try {
			const created = await create_playlist({ title: trimmed_title });
			await goto(resolve(`/admin/content/videos/playlists/${created.id}`));
		} catch (error) {
			console.error(error);
			create_error = error instanceof Error ? error.message : 'Unable to create playlist.';
			creating = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Playlists</h1>
		<AdminActions>
			<form class="flex" style:--flex-gap="var(--pad-xsmall)" onsubmit={create_new_playlist}>
				<input
					type="text"
					bind:value={new_playlist_title}
					placeholder="New playlist title"
					disabled={creating}
				/>
				<button type="submit" disabled={creating}>
					{creating ? 'Creating...' : 'Create Playlist'}
				</button>
			</form>
		</AdminActions>
	</div>

	{#if create_error}
		<p class="fs-2" style="color: var(--c-red)">{create_error}</p>
	{/if}

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		visible_ids={list_result.items.map((item) => item.id)}
	>
		{#snippet filters()}
			<div class="stack" style:--stack-gap="var(--pad-small)">
				<AdminSearch
					text={search_text}
					on_input={(value) => update_url({ q: value || null, page: null })}
					placeholder="Search playlists"
				/>
				{#if show_clear_filters}
					<div
						class="flex"
						style="

--flex-gap: var(--pad-small)"
					>
						<a class="button small" href={resolve('/admin/content/videos/playlists')}>× Clear</a>
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet table_head()}
			<th>Title</th>
			<th>Slug</th>
			<th>Videos count</th>
			<th>Created</th>
		{/snippet}

		{#snippet table_body()}
			{#each list_result.items as playlist_row (playlist_row.id)}
				<tr>
					<td>
						<a href={resolve(`/admin/content/videos/playlists/${playlist_row.id}`)}>
							{playlist_row.title}
						</a>
					</td>
					<td>/{playlist_row.slug}</td>
					<td>{playlist_row.videos.length}</td>
					<td>
						{#if playlist_row.created_at}
							{format(playlist_row.created_at, 'MMM d, yyyy')}
						{:else}
							-
						{/if}
					</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="4">No playlists found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
