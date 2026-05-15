<script lang="ts">
	import { format } from 'date-fns';
	import AdminSearch from '../../../AdminSearch.svelte';
	import { list_playlists } from './admin_playlists.remote';

	let search_text = $state('');
	const playlists = await list_playlists();

	let filtered_playlists = $derived(
		playlists.filter((playlist) =>
			playlist.title.toLowerCase().includes(search_text.toLowerCase())
		)
	);
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Playlists</h1>
	</div>

	<AdminSearch bind:text={search_text} />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Title</th>
					<th>Videos</th>
					<th>Created</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered_playlists.length === 0}
					<tr>
						<td colspan="4">No playlists found.</td>
					</tr>
				{:else}
					{#each filtered_playlists as playlist (playlist.id)}
						<tr>
							<td>{playlist.title}</td>
							<td>{playlist.videos.length}</td>
							<td>{format(playlist.created_at, 'MMM d, yyyy')}</td>
							<td>
								<a
									class="button small"
									href={`/admin/content/videos/playlists/${playlist.id}`}
								>
									Edit
								</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
