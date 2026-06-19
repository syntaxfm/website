<script lang="ts">
	import { format } from 'date-fns';
	import {
		import_remote_playlists,
		get_remote_playlists,
		import_playlist
	} from '../admin_videos.remote';
	import AdminActions from '../../../AdminActions.svelte';
	import AdminSearch from '../../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';

	let search_text = $state('');
	let { playlists, local_playlists } = $derived(await get_remote_playlists());

	let filtered_playlists = $derived.by(() => {
		const query = search_text.toLowerCase();
		if (!query) return playlists;

		return playlists.filter((playlist) => playlist.title.toLowerCase().includes(query));
	});
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Youtube Playlists</h1>
		<AdminActions>
			<button onclick={() => import_remote_playlists()}>Sync Playlists</button>
		</AdminActions>
	</div>

	<AdminList
		total={filtered_playlists.length}
		page={1}
		page_size={filtered_playlists.length}
		total_pages={1}
		on_page_change={() => {}}
		visible_ids={filtered_playlists.map((playlist) => playlist.playlist_id)}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => {
					search_text = value;
				}}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Title</th>
			<th>Videos</th>
			<th>Published At</th>
			<th>Id</th>
			<th>Action</th>
		{/snippet}

		{#snippet table_body()}
			{#each filtered_playlists as playlist (playlist.playlist_id)}
				<tr>
					<td>
						{playlist.title}
					</td>
					<td>
						{playlist.videos_count}
					</td>
					<td>
						{format(playlist.created_at, 'MMM d, yyyy')}
					</td>
					<td class="center">
						{playlist.playlist_id}
					</td>
					<td class="center">
						<button onclick={() => import_playlist(playlist.playlist_id)}>
							{local_playlists.includes(playlist.playlist_id) ? 'Sync Playlist' : 'Link To Local'}
						</button>
					</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="5">No playlists found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
