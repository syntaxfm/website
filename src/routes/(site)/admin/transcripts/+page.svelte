<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import { ActionResult } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import { format } from 'date-fns';
	import FormWithLoader from '$/lib/FormWithLoader.svelte';

	export let data: PageData;
	$: ({ transcripts, utterances_with_embeddings } = data);
	$: utterance_total = transcripts.map((t) => t._count.utterances).reduce((a, b) => a + b, 0);
</script>

<h4>Embeddings</h4>

<FormWithLoader global={false} action="?/fetch_embedding" method="post" let:loading>
	<button type="submit">Fetch{loading ? 'ing' : ''} an Embedding</button>
</FormWithLoader>
<FormWithLoader global={false} action="?/cluster_embeddings" method="post" let:loading>
	<button type="submit">Cluster{loading ? 'ing' : ''} an Embedding</button>
</FormWithLoader>
<FormWithLoader global={false} action="?/embed_entire_episode" method="post" let:loading>
	<button type="submit">Embed{loading ? 'ing' : ''} Entire Episode!</button>
</FormWithLoader>

<p>
	There are <mark>{utterances_with_embeddings.toLocaleString()}</mark> Utterances with Embeddings. {(
		utterance_total - utterances_with_embeddings
	).toLocaleString()} left to embed
</p>

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
