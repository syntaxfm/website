<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import AdminSearch from '$/lib/AdminSearch.svelte';
	import FormButton from '$/lib/FormButton.svelte';
	import { format } from 'date-fns';
	export let data;
	$: ({ local_playlists } = data);

	let search_text = '';
</script>

<h1 class="h4">🔄 Synced Playlists</h1>

<AdminActions>
	<a href="/admin/video/import">Import New Videos</a>
</AdminActions>

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
				</tr>
			</thead>
			<tbody>
				{#each local_playlists.filter((s) => s.title
						.toLowerCase()
						.includes(search_text.toLowerCase())) as playlist}
					<tr>
						<td>
							<a href="/admin/video/{playlist.id}">
								{playlist.title}
							</a>
						</td>
						<td>
							{playlist.item_count}
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
