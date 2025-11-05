<script lang="ts">
	import AdminActions from '$lib/AdminActions.svelte';
	import AdminSearch from '$lib/AdminSearch.svelte';
	import { format } from 'date-fns';
	import {
		import_remote_playlists,
		get_remote_playlists,
		import_playlist
	} from '../admin_videos.remote';

	let search_text = $state('');
	let { playlists, local_playlists } = $derived(await get_remote_playlists());
</script>

<h1 class="h4">Youtube Playlists</h1>

<AdminActions>
	<button onclick={() => import_remote_playlists()}>Sync Playlists</button>
</AdminActions>

<p class="fs-micro">
	Playlists listed here are what exists on Youtube, if you need to import or update a specific
	playlist select import/update
</p>

<div>
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
				{#each playlists.filter((s) => s.title
						.toLowerCase()
						.includes(search_text.toLowerCase())) as playlist}
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
							<button onclick={() => import_playlist(playlist.playlist_id)}
								>{local_playlists.includes(playlist.playlist_id) ? '🔄 Syncing' : 'Link To Local'}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
