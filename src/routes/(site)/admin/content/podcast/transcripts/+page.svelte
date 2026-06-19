<script lang="ts">
	import AdminActions from '../../../AdminActions.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { delete_all_transcripts, import_all_transcripts } from '../admin_podcast.remote';

	let { data } = $props();
	let { transcripts } = $derived(data);

	type status_type = 'success' | 'error';
	let status_message = $state('');
	let status_kind = $state<status_type | null>(null);

	async function handle_import_all_transcripts() {
		try {
			await import_all_transcripts();
			status_kind = 'success';
			status_message = 'Transcripts import completed.';
			window.location.reload();
		} catch (error) {
			status_kind = 'error';
			status_message = error instanceof Error ? error.message : 'Failed to import transcripts.';
		}
	}

	async function handle_delete_all_transcripts() {
		try {
			await delete_all_transcripts();
			status_kind = 'success';
			status_message = 'Dropped all transcripts.';
			window.location.reload();
		} catch (error) {
			status_kind = 'error';
			status_message = error instanceof Error ? error.message : 'Failed to delete transcripts.';
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Transcripts</h1>
		<AdminActions>
			<button type="button" onclick={handle_import_all_transcripts}>Import All Transcripts</button>
			<button class="warning" type="button" onclick={handle_delete_all_transcripts}>
				Drop All Transcripts
			</button>
		</AdminActions>
	</div>

	{#if status_message}
		<p class={status_kind === 'error' ? 'alert alert-error' : 'alert alert-success'}>
			{status_message}
		</p>
	{/if}

	<AdminList
		total={transcripts.length}
		page={1}
		page_size={transcripts.length}
		total_pages={1}
		on_page_change={() => {}}
		visible_ids={transcripts.map((transcript) => transcript.id)}
	>
		{#snippet table_head()}
			<th>Number</th>
			<th>Name</th>
			<th>Utterance Count</th>
		{/snippet}

		{#snippet table_body()}
			{#each transcripts as transcript (transcript.show_number)}
				<tr>
					<td>{transcript.show_number}</td>
					<td>{transcript.show.title}</td>
					<td>{transcript.utterance_count}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="3">No Transcripts found</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
