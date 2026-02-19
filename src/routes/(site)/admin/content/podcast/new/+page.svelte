<script lang="ts">
	import { goto } from '$app/navigation';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '$lib/admin/MarkdownEditor.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import { create_show_editor } from '../admin_podcast.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	let show_number_input = $state<number | null>(null);
	let title = $state('');
	let slug = $state('');
	let status = $state<Status>('DRAFT');
	let published_at = $state<Date | null>(null);
	let show_notes = $state('');
	let url = $state('');
	let youtube_url = $state('');

	let creating = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	async function create_show() {
		if (!show_number_input || !Number.isInteger(show_number_input) || show_number_input < 1) {
			status_error = 'Show number must be a positive integer.';
			return;
		}

		const parsed_show_number = show_number_input;

		creating = true;
		clear_feedback();

		try {
			const result = await create_show_editor({
				show_number: parsed_show_number,
				title,
				slug,
				status,
				published_at_iso: published_at ? published_at.toISOString() : null,
				show_notes,
				url,
				youtube_url: youtube_url.trim() || null
			});

			status_message = `Show #${result.show_number} created.`;
			await goto(`/admin/content/podcast/${result.show_number}`);
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to create show.';
		} finally {
			creating = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-small)">
	<h1 class="h3">Create Show</h1>

	<form
		class="stack"
		style:--stack-gap="var(--pad-small)"
		onsubmit={(event) => {
			event.preventDefault();
			void create_show();
		}}
	>
		<label class="stack" style:--stack-gap="0.35rem">
			Show number
			<input type="number" min="1" step="1" bind:value={show_number_input} required />
		</label>

		<label class="stack" style:--stack-gap="0.35rem">
			Title
			<input type="text" bind:value={title} required />
		</label>

		<SlugEditor bind:title bind:slug show_regenerate={false} />
		<StatusSelect bind:status />
		<DateTimePicker bind:value={published_at} label="Published at" show_clear={false} />

		<label class="stack" style:--stack-gap="0.35rem">
			Audio URL
			<input type="url" bind:value={url} required />
		</label>

		<label class="stack" style:--stack-gap="0.35rem">
			YouTube URL
			<input
				type="url"
				bind:value={youtube_url}
				placeholder="https://www.youtube.com/watch?v=..."
			/>
		</label>

		<MarkdownEditor bind:value={show_notes} label="Show notes" rows={18} />

		<button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Show'}</button>
	</form>

	{#if status_message}
		<p>{status_message}</p>
	{/if}

	{#if status_error}
		<p>{status_error}</p>
	{/if}
</div>
