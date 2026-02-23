<script lang="ts">
	import { format } from 'date-fns';
	import {
		import_remote_playlists,
		get_remote_playlists,
		import_playlist
	} from '../admin_videos.remote';
	import AdminActions from '../../../AdminActions.svelte';
	import AdminSearch from '../../../AdminSearch.svelte';

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

	<AdminSearch bind:text={search_text} />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Title</th>
					<th>Videos</th>
					<th>Published At</th>
					<th>Id</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered_playlists.length === 0}
					<tr>
						<td colspan="5">No playlists found.</td>
					</tr>
				{:else}
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
									{local_playlists.includes(playlist.playlist_id)
										? 'Sync Playlist'
										: 'Link To Local'}
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
