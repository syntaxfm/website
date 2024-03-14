<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import AdminSearch from '$/lib/AdminSearch.svelte';
	import FormButton from '$/lib/FormButton.svelte';
	import { format } from 'date-fns';

	export let data;
	$: ({ playlists, local_playlists } = data);

	let search_text = '';
</script>

<h1 class="h4">Youtube Playlists</h1>

<AdminActions>
	<FormButton text="Sync Playlists" thinking_text="Syncing..." action_path="?/import" />
</AdminActions>

<p class="small">
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
							<FormButton
								text={local_playlists.includes(playlist.playlist_id)
									? '🔄 Syncing'
									: 'Link To Local'}
								thinking_text="Linking..."
								action_path="?/import_playlist"
							>
								<input type="hidden" name="playlist_id" value={playlist.playlist_id} />
							</FormButton>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
