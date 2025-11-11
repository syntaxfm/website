<script lang="ts">
	import { page } from '$app/state';
	import AdminSearch from '../../../AdminSearch.svelte';

	import { get_playlist } from '../admin_videos.remote';
	let search_text = $state('');

	const playlist = $derived(await get_playlist(page.params.playlist_id!));

	let filtered = $derived(
		playlist?.videos?.filter((s) => s.video.title.toLowerCase().includes(search_text.toLowerCase()))
	);
</script>

<h1>{playlist?.title}</h1>

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
				{#if filtered}
					{#each filtered as video}
						<tr>
							<td>
								{video.video.title}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
