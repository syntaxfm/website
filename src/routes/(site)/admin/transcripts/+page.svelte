<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ transcripts } = data);
</script>

<h1 class="h4">Transcripts</h1>
<AdminActions>
	<form action="?/import_transcripts" method="post" use:enhance={form_action()}>
		<button type="submit">Import All Transcripts</button>
	</form>
	<form action="?/delete_all_transcripts" method="post" use:enhance={form_action()}>
		<button class="warning" type="submit">Drop All transcripts</button>
	</form>
	<form action="/webhooks/refresh" method="post">
		<button class="subtle" type="submit">Test Post</button>
	</form>
</AdminActions>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Number</th>
				<th>Name</th>
				<th>Utterance Count</th>
			</tr>
		</thead>
		<tbody>
			{#if !transcripts}
				<tr>
					<td colspan="4">No Transcripts found</td>
				</tr>
			{:else}
				{#each transcripts as transcript}
					<tr>
						<td>{transcript.show_number}</td>
						<td>{transcript.show.title}</td>
						<td>{transcript._count.utterances}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
