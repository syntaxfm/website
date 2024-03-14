<!-- src/routes/playlists/[playlist_id]/+page.svelte -->
<script lang="ts">
	import AdminSearch from '$/lib/AdminSearch.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { playlist, videos } = data;

	let search_text = '';
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
				{#each videos?.filter((s) => s.title
						.toLowerCase()
						.includes(search_text.toLowerCase())) as playlist}
					<tr>
						<td>
							{playlist.title}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
