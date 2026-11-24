<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import { build_url, page_of, read_int, read_string } from '#lib/admin/admin_filters.ts';
	import AdminConfirmDialog from '#lib/admin/AdminConfirmDialog.svelte';
	import AdminPageHeader from '#lib/admin/AdminPageHeader.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import { delete_all_transcripts, import_all_transcripts } from '../admin_podcast.remote';
	import type { PageData } from './$types';

	type PendingAction = 'import' | 'delete';
	type FeedbackTone = 'positive' | 'negative';

	let { data }: { data: PageData } = $props();
	const PAGE_SIZE = 50;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let list_result = $derived.by(() => {
		const query = search_text.trim().toLowerCase();
		const matches = query
			? data.transcripts.filter(
					(transcript) =>
						transcript.show.title.toLowerCase().includes(query) ||
						String(transcript.show_number) === query.replace('#', '')
				)
			: data.transcripts;
		return page_of(matches, page_number, PAGE_SIZE);
	});

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), { replace: true, reset: false });
	}
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
			await invalidateAll();
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
			await invalidateAll();
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
	<AdminPageHeader title="Transcripts">
		{#snippet actions()}
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
			<button
				type="button"
				data-intent="primary"
				onclick={handle_import_all_transcripts}
				disabled={pending_action !== null}
			>
				{pending_action === 'import' ? 'Importing…' : 'Import all'}
			</button>
		{/snippet}
	</AdminPageHeader>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		visible_ids={list_result.items.map((transcript) => transcript.id)}
		clear_href={search_text ? resolve('admin/content/podcast/transcripts') : null}
		message={status_tone === 'positive' ? status_message : ''}
		error={status_tone === 'negative' ? status_message : ''}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => update_url({ q: value || null, page: null })}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Number</th>
			<th>Show</th>
			<th class="admin-cell-number">Lines</th>
		{/snippet}

		{#snippet table_body()}
			{#each list_result.items as transcript (transcript.show_number)}
				<tr>
					<td class="admin-cell-muted">#{transcript.show_number}</td>
					<AdminTitleCell
						title={transcript.show.title}
						edit_href={resolve(`admin/content/podcast/${transcript.show_number}`)}
						public_href={resolve(
							`show/${transcript.show_number}/${transcript.show.slug}/transcript`
						)}
					/>
					<td class="admin-cell-number" data-label="Lines"
						>{transcript.utterance_count.toLocaleString()}</td
					>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="3" class="admin-cell-muted">No matching transcripts.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
