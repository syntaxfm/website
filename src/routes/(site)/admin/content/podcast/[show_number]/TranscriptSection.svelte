<script lang="ts">
	import { resolve } from '$app/paths';
	import format_time from '$utilities/format_time';
	import AdminConfirmDialog from '#lib/admin/AdminConfirmDialog.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import { error_message } from '#lib/utils/error_message.ts';
	import {
		delete_show_transcript,
		get_transcript_editor,
		regenerate_show_transcript,
		rename_transcript_speaker,
		transcribe_show,
		update_transcript_line
	} from '../admin_podcast.remote';

	// An episode's transcript in its editor: make it (or make it again) with Grok, name its voices,
	// fix its lines, or delete it

	interface Props {
		show_number: number;
		show_slug: string;
		// The transcript's line count, or null while there is none
		line_count: number | null;
		// Grok needs the episode's audio
		has_audio: boolean;
		// After the transcript is made, replaced or deleted, so the editor can update around it
		onchange: () => Promise<void>;
	}

	let { show_number, show_slug, line_count, has_audio, onchange }: Props = $props();

	let busy = $state(false);
	let message = $state('');
	let error = $state('');
	let search_text = $state('');
	let page = $state(1);

	let query_input = $derived({ show_number, search_text, page });
	let editor = $derived(line_count === null ? null : await get_transcript_editor(query_input));

	async function run(action: () => Promise<{ message: string }>, fallback: string) {
		busy = true;
		message = '';
		error = '';
		try {
			message = (await action()).message;
			search_text = '';
			page = 1;
			await onchange();
		} catch (action_error) {
			console.error(fallback, action_error);
			error = error_message(action_error, fallback);
			throw action_error;
		} finally {
			busy = false;
		}
	}

	function transcribe() {
		run(() => transcribe_show({ show_number }), 'Unable to transcribe this episode.').catch(
			() => {}
		);
	}

	async function rename_speaker(speaker: number, speaker_name: string) {
		if (!editor) return;
		error = '';
		try {
			await rename_transcript_speaker({
				transcript_id: editor.transcript_id,
				speaker,
				speaker_name
			});
			await get_transcript_editor(query_input).refresh();
		} catch (rename_error) {
			console.error('Unable to rename voice', rename_error);
			error = error_message(rename_error, 'Unable to rename that voice.');
		}
	}

	async function update_line(id: string, text: string) {
		error = '';
		try {
			await update_transcript_line({ id, text });
		} catch (update_error) {
			console.error('Unable to update line', update_error);
			error = error_message(update_error, 'Unable to save that line.');
		}
	}
</script>

<section id="transcript" class="admin-section" aria-labelledby="transcript-heading">
	<h2 id="transcript-heading">Transcript</h2>

	{#if line_count === null}
		<div class="admin-row">
			<p class="admin-cell-muted">No transcript yet</p>
			<button
				type="button"
				data-intent="primary"
				onclick={transcribe}
				disabled={busy || !has_audio}
			>
				{busy ? 'Transcribing…' : 'Transcribe'}
			</button>
		</div>
		{#if error}
			<p class="admin-feedback" data-tone="negative" role="alert">{error}</p>
		{/if}
	{:else}
		<div class="admin-row">
			<a
				href={resolve(`show/${show_number}/${show_slug}/transcript`)}
				target="_blank"
				rel="noopener noreferrer">{line_count.toLocaleString()} lines</a
			>
			<div class="admin-actions">
				<AdminConfirmDialog
					title="Transcribe this episode again?"
					description="Grok transcribes the audio again and replaces every line, including fixes made here."
					confirm_phrase="REGENERATE"
					action_label="Transcribe again"
					trigger_label="Transcribe again"
					onconfirm={() =>
						run(
							() => regenerate_show_transcript({ show_number }),
							'Unable to transcribe this episode again.'
						)}
				/>
				<AdminConfirmDialog
					title="Delete this transcript?"
					description="Every line goes, including fixes made here."
					confirm_phrase="DELETE"
					action_label="Delete transcript"
					trigger_label="Delete"
					onconfirm={() =>
						run(() => delete_show_transcript({ show_number }), 'Unable to delete the transcript.')}
				/>
			</div>
		</div>

		{#if editor}
			<h3>Voices</h3>
			<ul class="admin-item-list transcript-voices">
				{#each editor.speakers as voice (voice.speaker)}
					<li>
						<label class="admin-visually-hidden" for={`voice-${voice.speaker}`}>
							Name for voice {voice.speaker + 1}
						</label>
						<input
							id={`voice-${voice.speaker}`}
							type="text"
							value={voice.speaker_name ?? ''}
							placeholder={`Voice ${voice.speaker + 1}`}
							onchange={(event) => rename_speaker(voice.speaker, event.currentTarget.value)}
						/>
						<span class="admin-cell-muted">{voice.lines.toLocaleString()} lines</span>
					</li>
				{/each}
			</ul>

			<h3>Lines</h3>
			<div class="transcript-lines">
				<AdminList
					total={editor.total}
					page={editor.page}
					total_pages={editor.total_pages}
					on_page_change={(next) => (page = next)}
					visible_ids={editor.lines.map((line) => line.id)}
					{message}
					{error}
				>
					{#snippet filters()}
						<AdminSearch
							text={search_text}
							placeholder="Find a line"
							label="Find a line"
							on_input={(value) => {
								search_text = value;
								page = 1;
							}}
						/>
					{/snippet}

					{#snippet table_head()}
						<th>Time</th>
						<th>Voice</th>
						<th>Line</th>
					{/snippet}

					{#snippet table_body()}
						{#each editor.lines as line (line.id)}
							<tr>
								<td class="admin-cell-muted admin-cell-number">{format_time(line.start)}</td>
								<td class="admin-cell-muted">{line.speaker_name ?? `Voice ${line.speaker + 1}`}</td>
								<td class="transcript-line">
									<textarea
										aria-label={`Line at ${format_time(line.start)}`}
										value={line.text}
										rows="1"
										onchange={(event) => update_line(line.id, event.currentTarget.value)}
									></textarea>
								</td>
							</tr>
						{/each}
					{/snippet}

					{#snippet empty()}
						<tr><td colspan="3" class="admin-cell-muted">No lines match.</td></tr>
					{/snippet}
				</AdminList>
			</div>
		{/if}
	{/if}
</section>

<style>
	/* A voice's name and its line count on one row */
	.transcript-voices > li {
		display: grid;
		grid-template-columns: minmax(0, 20rem) auto;
		align-items: center;
		justify-content: start;
	}

	/* Time and voice line up with the first line of a long passage */
	.transcript-lines :global(td) {
		vertical-align: top;
	}

	/* The line takes the row's width, so it reads like the transcript */
	.transcript-line {
		width: 100%;

		> textarea {
			width: 100%;
		}
	}
</style>
