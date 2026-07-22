<script lang="ts">
	import AdminList from '$lib/admin/AdminList.svelte';
	import AdminConfirmDialog from '$lib/admin/AdminConfirmDialog.svelte';
	import { delete_all_transcripts, import_all_transcripts } from '../admin_podcast.remote';
	import type { PageData } from './$types';

	type PendingAction = 'import' | 'delete';
	type FeedbackTone = 'positive' | 'negative';

	let { data }: { data: PageData } = $props();
	let transcripts = $derived(data.transcripts);
	let pending_action = $state<PendingAction | null>(null);
	let status_message = $state('');
	let status_tone = $state<FeedbackTone | null>(null);

	async function handle_import_all_transcripts(): Promise<void> {
		if (pending_action) {
			return;
		}

		pending_action = 'import';
		status_message = '';
		status_tone = null;

		try {
			const result = await import_all_transcripts();
			status_tone = 'positive';
			status_message = result.message;
			window.location.reload();
		} catch (error) {
			console.error('Unable to import transcripts', error);
			status_tone = 'negative';
			status_message = error instanceof Error ? error.message : 'Failed to import transcripts.';
		} finally {
			pending_action = null;
		}
	}

	async function handle_delete_all_transcripts(): Promise<void> {
		if (pending_action) {
			throw new Error('Another transcript action is already running.');
		}

		pending_action = 'delete';
		status_message = '';
		status_tone = null;

		try {
			const result = await delete_all_transcripts();
			status_tone = 'positive';
			status_message = result.message;
			window.location.reload();
		} catch (error) {
			console.error('Unable to delete all transcripts', error);
			status_tone = 'negative';
			status_message = error instanceof Error ? error.message : 'Failed to delete transcripts.';
			throw error;
		} finally {
			pending_action = null;
		}
	}
</script>

<svelte:head>
	<title>Show Transcripts | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-actions">
		<button
			type="button"
			data-intent="primary"
			onclick={handle_import_all_transcripts}
			disabled={pending_action !== null}
		>
			{pending_action === 'import' ? 'Importing…' : 'Import all'}
		</button>
		{#if pending_action === 'import'}
			<button type="button" data-intent="danger" disabled>Delete all</button>
		{:else}
			<AdminConfirmDialog
				title="Delete all transcripts?"
				description="This permanently deletes every imported transcript and all of their utterances."
				confirm_phrase="DELETE ALL"
				action_label="Delete all transcripts"
				trigger_label="Delete all"
				onconfirm={handle_delete_all_transcripts}
			/>
		{/if}
	</div>

	{#if status_message}
		<p
			class="admin-feedback"
			data-tone={status_tone}
			role={status_tone === 'negative' ? 'alert' : 'status'}
		>
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
				<td colspan="3">No transcripts found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
