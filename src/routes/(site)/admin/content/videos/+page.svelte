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

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Videos</h1>
		<AdminActions>
			<a class="button small" href="/admin/content/videos/import">Import New Videos</a>
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
				</tr>
			</thead>
			<tbody>
				{#if filtered_playlists.length === 0}
					<tr>
						<td colspan="4">No videos found.</td>
					</tr>
				{:else}
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
				{/if}
			</tbody>
		</table>
	</div>
</div>
