<script lang="ts">
	import { format } from 'date-fns';
	import { get_all_videos } from './admin_videos.remote';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';

	let search_text = $state('');
	const playlists = await get_all_videos();

	let filtered_playlists = $derived(
		playlists.filter((playlist) => playlist.title.toLowerCase().includes(search_text.toLowerCase()))
	);
</script>

<div class="stack" style:--stack-gap="var(--pad-small)">
	<h1 class="h3">🔄 Synced Playlists</h1>

	<p class="fs-2">
		YouTube is the canonical source for video metadata. Admin edits here are only for
		associations/workflow and sync operations.
	</p>

	<AdminActions>
		<a class="button" href="/admin/content/videos/import">Import New Videos</a>
	</AdminActions>

	<AdminSearch bind:text={search_text} />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Title</th>
					<th>Videos</th>
					<th>Published At</th>
					<th>Id</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered_playlists as playlist (playlist.id)}
					<tr>
						<td>
							<a href={`/admin/content/videos/${playlist.id}`}>
								{playlist.title}
							</a>
						</td>
						<td>
							{playlist.videos.length}
						</td>
						<td>
							{format(playlist.created_at, 'MMM d, yyyy')}
						</td>
						<td>
							{playlist.id}
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
