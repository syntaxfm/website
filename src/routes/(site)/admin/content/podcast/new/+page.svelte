<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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

	function clear_feedback(): void {
		status_message = '';
		status_error = '';
	}

	async function create_show(): Promise<void> {
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
			await goto(resolve(`/admin/content/podcast/${result.show_number}`));
		} catch (error) {
			console.error('Unable to create show', error);
			status_error = error instanceof Error ? error.message : 'Unable to create show.';
		} finally {
			creating = false;
		}
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		await create_show();
	}
</script>

<svelte:head>
	<title>New Show | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-actions">
		<button type="submit" form="new-show-form" data-intent="primary" disabled={creating}>
			{creating ? 'Creating…' : 'Create Show'}
		</button>
	</div>

	{#if status_message}
		<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
	{/if}

	{#if status_error}
		<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
	{/if}

	<form id="new-show-form" class="admin-editor stack" onsubmit={handle_submit}>
		<div class="admin-editor-layout">
			<div class="admin-editor-main">
				<div class="admin-field">
					<label for="show-title">Title</label>
					<input id="show-title" name="title" type="text" bind:value={title} required />
				</div>

				<SlugEditor bind:title bind:slug show_regenerate={false} />

				<div class="admin-field">
					<label for="show-audio-url">Audio URL</label>
					<input id="show-audio-url" name="url" type="url" bind:value={url} required />
				</div>

				<div class="admin-field">
					<label for="show-youtube-url">YouTube URL</label>
					<input
						id="show-youtube-url"
						name="youtube_url"
						type="url"
						bind:value={youtube_url}
						placeholder="https://www.youtube.com/watch?v=..."
					/>
				</div>

				<MarkdownEditor bind:value={show_notes} label="Show notes" rows={18} />
			</div>

			<aside class="admin-metadata-rail" aria-labelledby="show-metadata-heading">
				<h2 id="show-metadata-heading" class="h5">Metadata</h2>
				<div class="admin-field">
					<label for="show-number">Show number</label>
					<input
						id="show-number"
						name="show_number"
						type="number"
						min="1"
						step="1"
						bind:value={show_number_input}
						required
					/>
				</div>

				<StatusSelect bind:status />
				<DateTimePicker bind:value={published_at} label="Published at" show_clear={false} />
			</aside>
		</div>
	</form>
</div>
