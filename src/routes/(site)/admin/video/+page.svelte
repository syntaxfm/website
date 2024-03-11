<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import AdminSearch from '$/lib/AdminSearch.svelte';
	import FormButton from '$/lib/FormButton.svelte';
	import { format } from 'date-fns';
	export let data;
	$: ({ local_playlists } = data);

	let search_text = '';
</script>

<h1 class="h4">Synced Playlists</h1>

<AdminActions>
	<a href="/admin/video/import">Import New Videos</a>
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
				{#each local_playlists.filter((s) => s.title
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
								text="Link To Local"
								thinking_text="Linking..."
								action_path="?/import_playlist"
							>
								<input type="hidden" name="playlist_id" value={playlist.playlist_id} />
							</FormButton>

							<div>🔄 Syncing</div>
							<button class="warning">Unlink</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Types of videos -->
<!-- Playlists ie what is weds, tech tapas -->
<!-- Syntax Entrees/Dishes/CJ Deep Dish -->
<!-- Still in a playlist, but connected to a syntax episode(s) -->
<!-- One off videos -->

<!-- When you bring in a playlist a cron will look to see if it should update or not -->
