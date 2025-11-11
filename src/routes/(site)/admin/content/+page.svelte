<script lang="ts">
	import AdminActions from '../AdminActions.svelte';

	import { get_all_content } from './admin_content.remote';
	let search_text = $state('');
</script>

<h1 class="h4">Content</h1>
<AdminActions>
	<!-- Potentially needed for migration -->
	<!-- <button onclick={() => populate_content_from_existing_data()}>Populate Content</button> -->
</AdminActions>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Title</th>
				<th>Type</th>
			</tr>
		</thead>
		<tbody>
			{#each (await get_all_content()).filter((s) => s.title
					.toLowerCase()
					.includes(search_text.toLowerCase())) as show}
				<tr>
					<td>
						<a href="/{show.slug}" target="_blank">
							{show.title}
							[↗]</a
						>
						<br />
						<!-- <span>
								{show.date.getTime() > Date.now() ? 'Scheduled' : 'Published'}
								{format(show.date, 'EEE MMM d yyyy h:mm:ss a z')}
							</span> -->
					</td>

					<td class="center">
						<span class="label {show.type.toLowerCase()}">
							{show.type}
						</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
