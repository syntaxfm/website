<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import DateTimePicker from '#lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '#lib/admin/MarkdownEditor.svelte';
	import SlugEditor from '#lib/admin/SlugEditor.svelte';
	import StatusSelect from '#lib/admin/StatusSelect.svelte';
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
	// A draft may wait for its number and audio; publishing needs both
	let can_publish = $derived(typeof show_number_input === 'number' && url.trim() !== '');

	let creating = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	function clear_feedback(): void {
		status_message = '';
		status_error = '';
	}

	async function create_show(): Promise<void> {
		if (
			typeof show_number_input === 'number' &&
			(!Number.isInteger(show_number_input) || show_number_input < 0)
		) {
			status_error = 'An episode number is a whole number, 0 or above.';
			return;
		}

		creating = true;
		clear_feedback();

		try {
			const result = await create_show_editor({
				show_number: typeof show_number_input === 'number' ? show_number_input : null,
				title,
				slug,
				status,
				published_at_iso: published_at ? published_at.toISOString() : null,
				show_notes,
				url: url.trim() || null,
				youtube_url: youtube_url.trim() || null
			});

			status_message = 'Show created.';
			await goto(resolve(`admin/content/podcast/${result.content_id}`));
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
	<AdminEditorHeader title={title || 'New show'} detail="New show">
		{#snippet actions()}
			<button type="submit" form="new-show-form" data-intent="primary" disabled={creating}>
				{creating ? 'Creating…' : 'Create show'}
			</button>
		{/snippet}
	</AdminEditorHeader>

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
					<input id="show-audio-url" name="url" type="url" bind:value={url} />
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

			<aside class="admin-metadata-rail" aria-label="Show settings">
				<div class="admin-field">
					<label for="show-number">Show number</label>
					<input
						id="show-number"
						name="show_number"
						type="number"
						min="0"
						step="1"
						bind:value={show_number_input}
					/>
				</div>

				<StatusSelect bind:status {can_publish} />
				<DateTimePicker bind:value={published_at} label="Published at" show_clear={false} />
			</aside>
		</div>
	</form>
</div>
