<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ transcripts } = data);
</script>

<h4>Transcripts</h4>
<div>
	<form action="?/import_transcripts" method="post" use:enhance={form_action()}>
		<button type="submit">Import All Transcripts</button>
	</form>
	<form action="?/delete_all_transcripts" method="post" use:enhance={form_action()}>
		<button type="submit">Drop All transcripts</button>
	</form>
	<form action="/webhooks/refresh" method="post">
		<button type="submit">Test Post</button>
	</form>
</div>

<table>
	<thead>
		<tr>
			<th>Show Number</th>
			<th>Show Name</th>
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
