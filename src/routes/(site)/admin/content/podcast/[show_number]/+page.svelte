<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import AdminConfirmDialog from '#lib/admin/AdminConfirmDialog.svelte';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import DateTimePicker from '#lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '#lib/admin/MarkdownEditor.svelte';
	import MultiSelect from '#lib/admin/MultiSelect.svelte';
	import SlugEditor from '#lib/admin/SlugEditor.svelte';
	import StatusSelect from '#lib/admin/StatusSelect.svelte';
	import { create_autosave_controller } from '#lib/utils/autosave.svelte.ts';
	import { humanize_enum } from '#lib/utils/format_enum.ts';
	import {
		add_ai_guest,
		add_ai_summary_entry,
		add_ai_tweet,
		add_link,
		add_topic,
		delete_ai_guest,
		delete_ai_summary_entry,
		delete_ai_tweet,
		delete_link,
		delete_topic,
		fetch_ai_notes,
		get_show_editor,
		search_guests,
		search_users_for_host,
		sync_spotify_for_show,
		update_ai_guest,
		update_ai_show_note,
		update_ai_summary_entry,
		update_ai_tweet,
		update_link,
		update_show_editor,
		update_topic
	} from '../admin_podcast.remote';
	import { get_tag_options } from '../../admin_content.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface GuestItem {
		id: string;
		name: string;
		name_slug: string;
	}

	interface TagOption {
		id: string;
		name: string;
	}

	interface HostUser {
		id: string;
		username: string | null;
		name: string | null;
		email: string | null;
	}

	interface ShowEditorPayload {
		show_number: number;
		title: string;
		slug: string;
		status: Status;
		published_at_iso: string | null;
		show_notes: string;
		url: string;
		youtube_url: string | null;
		host_ids?: string[];
		guest_ids?: string[];
		tag_ids?: string[];
	}

	type ShowRelationshipUpdate =
		| { relationship: 'guests'; ids: string[] }
		| { relationship: 'hosts'; ids: string[] }
		| { relationship: 'tags'; ids: string[] };

	interface AiSummaryEntryRow {
		id: number;
		time: string;
		text: string;
		description: string | null;
	}

	interface AiTweetRow {
		id: number;
		content: string;
	}

	interface AiLinkRow {
		id: number;
		name: string;
		url: string;
		timestamp: string | null;
	}

	interface AiGuestRow {
		id: number;
		name: string;
	}

	interface AiTopicRow {
		id: number;
		name: string;
	}

	interface AiShowNoteData {
		id: number;
		title: string;
		description: string;
		summary: AiSummaryEntryRow[];
		tweets: AiTweetRow[];
		links: AiLinkRow[];
		guests: AiGuestRow[];
		topics: AiTopicRow[];
	}

	const show_number = Number((page.params as Record<string, string>).show_number || '0');
	const show = await get_show_editor(show_number);

	const initial_guest_lookup = Object.fromEntries(
		(show?.guests ?? []).map((show_guest: { guest: GuestItem }) => [
			show_guest.guest.id,
			show_guest.guest
		])
	);

	const initial_selected_guest_ids = (show?.guests ?? []).map(
		(show_guest: { guest_id: string }) => show_guest.guest_id
	);
	const initial_selected_tag_ids =
		show?.meta?.tags.map((content_tag: { tag: { id: string } }) => content_tag.tag.id) ?? [];

	let title = $state(show?.title ?? '');
	let slug = $state(show?.slug ?? '');
	let status = $state<Status>((show?.meta?.status as Status) ?? 'DRAFT');
	const initial_published_at = show?.meta?.published_at ?? show?.date ?? null;
	let published_at = $state<Date | null>(
		initial_published_at ? new Date(initial_published_at.getTime()) : null
	);
	let show_notes = $state(show?.show_notes ?? '');
	let url = $state(show?.url ?? '');
	let youtube_url = $state(show?.youtube_url ?? '');

	let selected_guest_ids = $state<string[]>([...initial_selected_guest_ids]);
	let selected_tag_ids = $state<string[]>([...initial_selected_tag_ids]);

	let guest_lookup = $state<Record<string, GuestItem>>(initial_guest_lookup);

	let guest_search_text = $state('');
	let host_search_text = $state('');
	let guest_search_results = $state<GuestItem[]>([]);
	let host_search_results = $state<HostUser[]>([]);

	let attached_hosts = $state<HostUser[]>(
		(show?.hosts ?? []).map((host_row: { profile: HostUser }) => host_row.profile)
	);

	const initial_ai_show_note: AiShowNoteData | null = show?.aiShowNote
		? {
				id: show.aiShowNote.id,
				title: show.aiShowNote.title,
				description: show.aiShowNote.description,
				summary: (show.aiShowNote.summary ?? []).map((row: AiSummaryEntryRow) => ({
					id: row.id,
					time: row.time,
					text: row.text,
					description: row.description ?? null
				})),
				tweets: (show.aiShowNote.tweets ?? []).map((row: AiTweetRow) => ({
					id: row.id,
					content: row.content
				})),
				links: (show.aiShowNote.links ?? []).map((row: AiLinkRow) => ({
					id: row.id,
					name: row.name,
					url: row.url,
					timestamp: row.timestamp ?? null
				})),
				guests: (show.aiShowNote.guests ?? []).map((row: AiGuestRow) => ({
					id: row.id,
					name: row.name
				})),
				topics: (show.aiShowNote.topics ?? []).map((row: AiTopicRow) => ({
					id: row.id,
					name: row.name
				}))
			}
		: null;

	let ai_show_note = $state<AiShowNoteData | null>(initial_ai_show_note);
	const has_transcript = Boolean(show?.transcript);

	let new_summary_time = $state('');
	let new_summary_text = $state('');
	let new_summary_description = $state('');
	let new_tweet_content = $state('');
	let new_link_name = $state('');
	let new_link_url = $state('');
	let new_link_timestamp = $state('');
	let new_ai_guest_name = $state('');
	let new_topic_name = $state('');

	const tag_options = (await get_tag_options()).map((tag_item: TagOption) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let syncing_spotify = $state(false);
	let ai_busy = $state(false);

	let status_message = $state('');
	let status_error = $state('');

	let regenerate_form_element: HTMLFormElement | undefined;
	let resolve_regeneration: (() => void) | undefined;
	let reject_regeneration: ((error: unknown) => void) | undefined;

	const autosave = create_autosave_controller<ShowEditorPayload>(
		async (payload) => {
			try {
				await update_show_editor(payload);
			} catch (error) {
				console.error('Unable to autosave show', error);
				throw error;
			}
		},
		{
			merge_pending_values: (previous_value, next_value) => ({
				...previous_value,
				...next_value
			})
		}
	);

	onDestroy(() => autosave.cleanup());

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	function add_guest(guest: GuestItem) {
		if (selected_guest_ids.includes(guest.id)) {
			return;
		}

		guest_lookup = {
			...guest_lookup,
			[guest.id]: guest
		};
		selected_guest_ids = [...selected_guest_ids, guest.id];
		save_immediately({ relationship: 'guests', ids: selected_guest_ids });
	}

	function remove_guest(guest_id: string) {
		selected_guest_ids = selected_guest_ids.filter((id) => id !== guest_id);
		save_immediately({ relationship: 'guests', ids: selected_guest_ids });
	}

	async function run_guest_search() {
		if (!show) {
			return;
		}

		clear_feedback();

		try {
			const result = await search_guests({
				search_text: guest_search_text.trim() || undefined
			});
			guest_search_results = result;
			for (const guest_item of result) {
				guest_lookup = {
					...guest_lookup,
					[guest_item.id]: guest_item
				};
			}
		} catch (error) {
			console.error(error);
			status_error = 'Unable to search guests.';
		}
	}

	function create_show_editor_payload(
		relationship_update?: ShowRelationshipUpdate
	): ShowEditorPayload | null {
		if (!show) {
			return null;
		}

		const payload: ShowEditorPayload = {
			show_number: show.number,
			title,
			slug,
			status,
			published_at_iso: published_at ? published_at.toISOString() : null,
			show_notes,
			url,
			youtube_url: youtube_url.trim() || null
		};

		switch (relationship_update?.relationship) {
			case 'guests':
				return { ...payload, guest_ids: [...relationship_update.ids] };
			case 'hosts':
				return { ...payload, host_ids: [...relationship_update.ids] };
			case 'tags':
				return { ...payload, tag_ids: [...relationship_update.ids] };
			default:
				return payload;
		}
	}

	function schedule_save(relationship_update?: ShowRelationshipUpdate): void {
		const payload = create_show_editor_payload(relationship_update);
		if (payload) {
			autosave.schedule(payload);
		}
	}

	function save_immediately(relationship_update?: ShowRelationshipUpdate): void {
		schedule_save(relationship_update);
		autosave.save_now().catch((error) => {
			console.error('Unable to flush show autosave', error);
		});
	}

	function handle_title_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		title = target.value;
		schedule_save();
	}

	function handle_slug_change(next_slug: string): void {
		slug = next_slug;
		schedule_save();
	}

	function handle_show_notes_change(next_show_notes: string): void {
		show_notes = next_show_notes;
		schedule_save();
	}

	function handle_audio_url_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		url = target.value;
		schedule_save();
	}

	function handle_youtube_url_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		youtube_url = target.value;
		schedule_save();
	}

	function handle_status_change(next_status: Status): void {
		status = next_status;
		if (status === 'PUBLISHED' && !published_at) {
			published_at = new Date();
		}
		save_immediately();
	}

	function handle_published_at_change(next_published_at: Date | null): void {
		published_at = next_published_at;
		save_immediately();
	}

	function handle_tag_change(next_selected_tag_ids: string[]): void {
		selected_tag_ids = [...next_selected_tag_ids];
		save_immediately({ relationship: 'tags', ids: selected_tag_ids });
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		schedule_save();
		await autosave.save_now();
	}

	async function sync_spotify() {
		if (!show) {
			status_error = 'Show not found.';
			return;
		}

		syncing_spotify = true;
		clear_feedback();

		try {
			const result = await sync_spotify_for_show({ show_number: show.number });
			status_message = result.message || 'Spotify sync completed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Spotify sync failed.';
		} finally {
			syncing_spotify = false;
		}
	}

	async function refresh_show_editor() {
		const refreshed = await get_show_editor(show_number);
		if (!refreshed) {
			return;
		}

		ai_show_note = refreshed.aiShowNote
			? {
					id: refreshed.aiShowNote.id,
					title: refreshed.aiShowNote.title,
					description: refreshed.aiShowNote.description,
					summary: (refreshed.aiShowNote.summary ?? []).map((row: AiSummaryEntryRow) => ({
						id: row.id,
						time: row.time,
						text: row.text,
						description: row.description ?? null
					})),
					tweets: (refreshed.aiShowNote.tweets ?? []).map((row: AiTweetRow) => ({
						id: row.id,
						content: row.content
					})),
					links: (refreshed.aiShowNote.links ?? []).map((row: AiLinkRow) => ({
						id: row.id,
						name: row.name,
						url: row.url,
						timestamp: row.timestamp ?? null
					})),
					guests: (refreshed.aiShowNote.guests ?? []).map((row: AiGuestRow) => ({
						id: row.id,
						name: row.name
					})),
					topics: (refreshed.aiShowNote.topics ?? []).map((row: AiTopicRow) => ({
						id: row.id,
						name: row.name
					}))
				}
			: null;
	}

	async function run_host_search() {
		if (!show) {
			return;
		}

		clear_feedback();

		try {
			const result = await search_users_for_host({
				search_text: host_search_text.trim() || undefined
			});
			host_search_results = result;
		} catch (error) {
			console.error(error);
			status_error = 'Unable to search users.';
		}
	}

	function attach_host(candidate: HostUser): void {
		if (attached_hosts.some((host_item) => host_item.id === candidate.id)) {
			return;
		}

		attached_hosts = [...attached_hosts, candidate];
		save_immediately({
			relationship: 'hosts',
			ids: attached_hosts.map((host_item) => host_item.id)
		});
	}

	function detach_host(user_id: string): void {
		attached_hosts = attached_hosts.filter((host_item) => host_item.id !== user_id);
		save_immediately({
			relationship: 'hosts',
			ids: attached_hosts.map((host_item) => host_item.id)
		});
	}

	function host_label(host: HostUser): string {
		return host.username || host.name || host.email || host.id;
	}

	async function save_ai_show_note() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			await update_ai_show_note({
				id: ai_show_note.id,
				title: ai_show_note.title,
				description: ai_show_note.description
			});
			status_message = 'AI show note saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save AI show note.';
		} finally {
			ai_busy = false;
		}
	}

	async function save_ai_summary_entry(entry: AiSummaryEntryRow) {
		ai_busy = true;
		clear_feedback();

		try {
			await update_ai_summary_entry({
				id: entry.id,
				time: entry.time,
				text: entry.text,
				description: entry.description
			});
			status_message = 'Summary entry saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save summary entry.';
		} finally {
			ai_busy = false;
		}
	}

	async function remove_ai_summary_entry(id: number) {
		ai_busy = true;
		clear_feedback();

		try {
			await delete_ai_summary_entry({ id });
			if (ai_show_note) {
				ai_show_note.summary = ai_show_note.summary.filter((row) => row.id !== id);
			}
			status_message = 'Summary entry removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove summary entry.';
		} finally {
			ai_busy = false;
		}
	}

	async function save_ai_tweet(tweet: AiTweetRow) {
		ai_busy = true;
		clear_feedback();

		try {
			await update_ai_tweet({ id: tweet.id, content: tweet.content });
			status_message = 'Tweet saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save tweet.';
		} finally {
			ai_busy = false;
		}
	}

	async function remove_ai_tweet(id: number) {
		ai_busy = true;
		clear_feedback();

		try {
			await delete_ai_tweet({ id });
			if (ai_show_note) {
				ai_show_note.tweets = ai_show_note.tweets.filter((row) => row.id !== id);
			}
			status_message = 'Tweet removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove tweet.';
		} finally {
			ai_busy = false;
		}
	}

	async function save_ai_link(row: AiLinkRow) {
		ai_busy = true;
		clear_feedback();

		try {
			await update_link({
				id: row.id,
				name: row.name,
				url: row.url,
				timestamp: row.timestamp
			});
			status_message = 'Link saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save link.';
		} finally {
			ai_busy = false;
		}
	}

	async function remove_ai_link(id: number) {
		ai_busy = true;
		clear_feedback();

		try {
			await delete_link({ id });
			if (ai_show_note) {
				ai_show_note.links = ai_show_note.links.filter((row) => row.id !== id);
			}
			status_message = 'Link removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove link.';
		} finally {
			ai_busy = false;
		}
	}

	async function save_ai_guest(row: AiGuestRow) {
		ai_busy = true;
		clear_feedback();

		try {
			await update_ai_guest({ id: row.id, name: row.name });
			status_message = 'AI guest saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save AI guest.';
		} finally {
			ai_busy = false;
		}
	}

	async function remove_ai_guest_row(id: number) {
		ai_busy = true;
		clear_feedback();

		try {
			await delete_ai_guest({ id });
			if (ai_show_note) {
				ai_show_note.guests = ai_show_note.guests.filter((row) => row.id !== id);
			}
			status_message = 'AI guest removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove AI guest.';
		} finally {
			ai_busy = false;
		}
	}

	async function save_topic(row: AiTopicRow) {
		ai_busy = true;
		clear_feedback();

		try {
			await update_topic({ id: row.id, name: row.name });
			status_message = 'Topic saved.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save topic.';
		} finally {
			ai_busy = false;
		}
	}

	async function remove_topic_row(id: number) {
		ai_busy = true;
		clear_feedback();

		try {
			await delete_topic({ id });
			if (ai_show_note) {
				ai_show_note.topics = ai_show_note.topics.filter((row) => row.id !== id);
			}
			status_message = 'Topic removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove topic.';
		} finally {
			ai_busy = false;
		}
	}

	async function add_summary_entry_row() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			const inserted = await add_ai_summary_entry({
				show_note_id: ai_show_note.id,
				time: new_summary_time.trim(),
				text: new_summary_text.trim(),
				description: new_summary_description.trim() || null
			});
			ai_show_note.summary = [
				...ai_show_note.summary,
				{
					id: inserted.id,
					time: inserted.time,
					text: inserted.text,
					description: inserted.description ?? null
				}
			];
			new_summary_time = '';
			new_summary_text = '';
			new_summary_description = '';
			status_message = 'Summary entry added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add summary entry.';
		} finally {
			ai_busy = false;
		}
	}

	async function add_tweet_row() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			const inserted = await add_ai_tweet({
				show_note_id: ai_show_note.id,
				content: new_tweet_content.trim()
			});
			ai_show_note.tweets = [
				...ai_show_note.tweets,
				{ id: inserted.id, content: inserted.content }
			];
			new_tweet_content = '';
			status_message = 'Tweet added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add tweet.';
		} finally {
			ai_busy = false;
		}
	}

	async function add_link_row() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			const inserted = await add_link({
				show_note_id: ai_show_note.id,
				name: new_link_name.trim(),
				url: new_link_url.trim(),
				timestamp: new_link_timestamp.trim() || null
			});
			ai_show_note.links = [
				...ai_show_note.links,
				{
					id: inserted.id,
					name: inserted.name,
					url: inserted.url,
					timestamp: inserted.timestamp ?? null
				}
			];
			new_link_name = '';
			new_link_url = '';
			new_link_timestamp = '';
			status_message = 'Link added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add link.';
		} finally {
			ai_busy = false;
		}
	}

	async function add_ai_guest_row() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			const inserted = await add_ai_guest({
				show_note_id: ai_show_note.id,
				name: new_ai_guest_name.trim()
			});
			ai_show_note.guests = [...ai_show_note.guests, { id: inserted.id, name: inserted.name }];
			new_ai_guest_name = '';
			status_message = 'AI guest added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add AI guest.';
		} finally {
			ai_busy = false;
		}
	}

	async function add_topic_row() {
		if (!ai_show_note) {
			return;
		}

		ai_busy = true;
		clear_feedback();

		try {
			const inserted = await add_topic({
				show_note_id: ai_show_note.id,
				name: new_topic_name.trim()
			});
			ai_show_note.topics = [...ai_show_note.topics, { id: inserted.id, name: inserted.name }];
			new_topic_name = '';
			status_message = 'Topic added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add topic.';
		} finally {
			ai_busy = false;
		}
	}

	function settle_regeneration(error?: unknown): void {
		const resolve_current_regeneration = resolve_regeneration;
		const reject_current_regeneration = reject_regeneration;
		resolve_regeneration = undefined;
		reject_regeneration = undefined;

		if (error === undefined) {
			resolve_current_regeneration?.();
		} else {
			reject_current_regeneration?.(error);
		}
	}

	function capture_regenerate_form(element: HTMLFormElement): () => void {
		regenerate_form_element = element;

		return () => {
			if (regenerate_form_element === element) {
				regenerate_form_element = undefined;
			}
		};
	}

	function regenerate_ai_notes(): Promise<void> {
		if (!regenerate_form_element) {
			return Promise.reject(new Error('AI regeneration form is unavailable.'));
		}

		return new Promise((resolve_promise, reject_promise) => {
			resolve_regeneration = resolve_promise;
			reject_regeneration = reject_promise;
			regenerate_form_element?.requestSubmit();
		});
	}
</script>

<svelte:head>
	<title>{show ? `Edit ${show.title}` : 'Show not found'} | Syntax Admin</title>
</svelte:head>

{#if !show}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">Show not found.</p>
	</div>
{:else}
	<div class="admin-page stack">
		<AdminEditorHeader
			back_href={resolve('admin/content/podcast')}
			back_label="Podcast"
			{title}
			detail={`#${show.number} · ${humanize_enum(show.show_type)}`}
			public_href={resolve(`show/${show.number}/${show.slug}`)}
			{autosave}
			sections={[
				{ id: 'details', label: 'Details' },
				{ id: 'people', label: 'People' },
				{ id: 'ai-notes', label: 'AI notes' }
			]}
		>
			{#snippet actions()}
				<button type="button" onclick={sync_spotify} disabled={syncing_spotify}>
					{syncing_spotify ? 'Syncing…' : 'Sync Spotify'}
				</button>
			{/snippet}
		</AdminEditorHeader>

		{#if status_message}
			<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
		{/if}
		{#if status_error}
			<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
		{/if}

		<form class="admin-editor stack" onsubmit={handle_submit}>
			<section id="details" class="admin-editor-layout" aria-label="Details">
				<div class="admin-editor-main">
					<div class="admin-field">
						<label for="show-title">Title</label>
						<input
							id="show-title"
							name="title"
							type="text"
							required
							bind:value={title}
							oninput={handle_title_input}
						/>
					</div>

					<SlugEditor bind:title bind:slug onchange={handle_slug_change} />

					<div class="admin-field">
						<label for="show-audio-url">Audio URL</label>
						<input
							id="show-audio-url"
							name="url"
							type="url"
							required
							bind:value={url}
							oninput={handle_audio_url_input}
						/>
					</div>

					<div class="admin-field">
						<label for="show-youtube-url">YouTube URL</label>
						<input
							id="show-youtube-url"
							name="youtube_url"
							type="url"
							bind:value={youtube_url}
							placeholder="https://www.youtube.com/watch?v=..."
							oninput={handle_youtube_url_input}
						/>
					</div>

					<MarkdownEditor
						bind:value={show_notes}
						label="Show notes"
						rows={18}
						onchange={handle_show_notes_change}
					/>
				</div>

				<aside class="admin-metadata-rail" aria-label="Show settings">
					<StatusSelect {status} onchange={handle_status_change} />
					<DateTimePicker
						value={published_at}
						label="Published at"
						onchange={handle_published_at_change}
					/>
					{#if show.meta?.id}
						<MultiSelect
							options={tag_options}
							selected_ids={selected_tag_ids}
							label="Tags"
							onchange={handle_tag_change}
						/>
					{/if}
				</aside>
			</section>

			<section id="people" class="admin-section" aria-labelledby="people-heading">
				<h2 id="people-heading">People</h2>

				<div class="admin-people">
					<div class="admin-field">
						<h3>Guests</h3>
						<AdminSearch
							text={guest_search_text}
							label="Find a guest"
							placeholder="Find a guest"
							on_input={(value) => {
								guest_search_text = value;
								void run_guest_search();
							}}
						/>
						{#if guest_search_text && guest_search_results.length > 0}
							<ul class="admin-pick-list" aria-label="Guest search results">
								{#each guest_search_results as guest_item (guest_item.id)}
									{@const is_added = selected_guest_ids.includes(guest_item.id)}
									<li>
										{guest_item.name}
										<button type="button" onclick={() => add_guest(guest_item)} disabled={is_added}>
											{is_added ? 'Added' : 'Add'}
										</button>
									</li>
								{/each}
							</ul>
						{/if}
						<ul class="admin-pick-list" aria-label="Guests on this show">
							{#each selected_guest_ids as guest_id (guest_id)}
								<li>
									{guest_lookup[guest_id]?.name ?? guest_id}
									<button type="button" data-intent="danger" onclick={() => remove_guest(guest_id)}
										>Remove</button
									>
								</li>
							{:else}
								<li class="admin-cell-muted">No guests</li>
							{/each}
						</ul>
					</div>

					<div class="admin-field">
						<h3>Hosts</h3>
						<AdminSearch
							text={host_search_text}
							label="Find a host"
							placeholder="Find a host"
							on_input={(value) => {
								host_search_text = value;
								void run_host_search();
							}}
						/>
						{#if host_search_text && host_search_results.length > 0}
							<ul class="admin-pick-list" aria-label="Host search results">
								{#each host_search_results as candidate (candidate.id)}
									{@const is_attached = attached_hosts.some(
										(host_item) => host_item.id === candidate.id
									)}
									<li>
										{host_label(candidate)}
										<button
											type="button"
											onclick={() => attach_host(candidate)}
											disabled={is_attached}
										>
											{is_attached ? 'Added' : 'Add'}
										</button>
									</li>
								{/each}
							</ul>
						{/if}
						<ul class="admin-pick-list" aria-label="Hosts on this show">
							{#each attached_hosts as host_item (host_item.id)}
								<li>
									{host_label(host_item)}
									<button
										type="button"
										data-intent="danger"
										onclick={() => detach_host(host_item.id)}>Remove</button
									>
								</li>
							{:else}
								<li class="admin-cell-muted">No hosts</li>
							{/each}
						</ul>
					</div>
				</div>
			</section>
		</form>

		<section id="ai-notes" class="admin-section" aria-labelledby="ai-notes-heading">
			<h2 id="ai-notes-heading">AI notes</h2>

			{#if !has_transcript}
				<p class="admin-feedback">Transcript required to generate AI notes.</p>
			{:else if !ai_show_note}
				<form
					class="admin-actions"
					{...fetch_ai_notes.enhance(async (form) => {
						ai_busy = true;
						clear_feedback();
						try {
							await form.submit();
							await refresh_show_editor();
							status_message = 'AI notes generated.';
						} catch (error) {
							console.error(error);
							status_error =
								error instanceof Error ? error.message : 'Unable to generate AI notes.';
						} finally {
							ai_busy = false;
						}
					})}
				>
					<input {...fetch_ai_notes.fields.show_number.as('hidden', show.number)} />
					<button type="submit" data-intent="primary" disabled={ai_busy}>
						{ai_busy ? 'Generating…' : 'Generate AI notes'}
					</button>
				</form>
			{:else}
				<form
					{@attach capture_regenerate_form}
					{...fetch_ai_notes.enhance(async (form) => {
						ai_busy = true;
						clear_feedback();
						let regeneration_error: unknown;
						try {
							await form.submit();
							await refresh_show_editor();
							status_message = 'AI notes regenerated.';
						} catch (error) {
							console.error(error);
							regeneration_error = error;
							status_error =
								error instanceof Error ? error.message : 'Unable to regenerate AI notes.';
						} finally {
							ai_busy = false;
							settle_regeneration(regeneration_error);
						}
					})}
				>
					<input {...fetch_ai_notes.fields.show_number.as('hidden', show.number)} />
				</form>

				<div class="admin-actions">
					<AdminConfirmDialog
						title="Regenerate AI notes?"
						description="This replaces every AI artifact, including manual edits."
						confirm_phrase="REGENERATE"
						action_label="Regenerate AI notes"
						onconfirm={regenerate_ai_notes}
					/>
				</div>

				<div class="admin-editor-main">
					<div class="admin-field">
						<label for="ai-show-title">AI title</label>
						<input id="ai-show-title" type="text" bind:value={ai_show_note.title} />
					</div>
					<div class="admin-field">
						<label for="ai-show-description">AI description</label>
						<textarea id="ai-show-description" bind:value={ai_show_note.description} rows="4"
						></textarea>
					</div>
					<div class="admin-actions">
						<button
							type="button"
							data-intent="primary"
							onclick={save_ai_show_note}
							disabled={ai_busy}
						>
							Save AI show note
						</button>
					</div>
				</div>

				<details>
					<summary>Summary entries ({ai_show_note.summary.length})</summary>
					{#if ai_show_note.summary.length === 0}
						<p class="admin-feedback">No summary entries.</p>
					{:else}
						<ul class="admin-item-list">
							{#each ai_show_note.summary as entry (entry.id)}
								<li>
									<label class="admin-field">
										Time
										<input type="text" bind:value={entry.time} />
									</label>
									<label class="admin-field">
										Text
										<input type="text" bind:value={entry.text} />
									</label>
									<label class="admin-field">
										Description
										<textarea bind:value={entry.description} rows="2"></textarea>
									</label>
									<div class="admin-actions">
										<button
											type="button"
											data-intent="primary"
											onclick={() => save_ai_summary_entry(entry)}
											disabled={ai_busy}
										>
											Save
										</button>
										<button
											type="button"
											data-intent="danger"
											onclick={() => remove_ai_summary_entry(entry.id)}
											disabled={ai_busy}
										>
											Delete
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
					<form
						class="admin-item-add"
						onsubmit={(event) => {
							event.preventDefault();
							void add_summary_entry_row();
						}}
					>
						<label class="admin-field">
							Time
							<input type="text" bind:value={new_summary_time} required />
						</label>
						<label class="admin-field">
							Text
							<input type="text" bind:value={new_summary_text} required />
						</label>
						<label class="admin-field">
							Description
							<textarea bind:value={new_summary_description} rows="2"></textarea>
						</label>
						<button type="submit" data-intent="primary" disabled={ai_busy}>Add summary entry</button
						>
					</form>
				</details>

				<details>
					<summary>Tweets ({ai_show_note.tweets.length})</summary>
					{#if ai_show_note.tweets.length === 0}
						<p class="admin-feedback">No tweets.</p>
					{:else}
						<ul class="admin-item-list">
							{#each ai_show_note.tweets as tweet (tweet.id)}
								<li>
									<label class="admin-field">
										Content
										<textarea bind:value={tweet.content} rows="3" maxlength="350"></textarea>
									</label>
									<div class="admin-actions">
										<button
											type="button"
											data-intent="primary"
											onclick={() => save_ai_tweet(tweet)}
											disabled={ai_busy}
										>
											Save
										</button>
										<button
											type="button"
											data-intent="danger"
											onclick={() => remove_ai_tweet(tweet.id)}
											disabled={ai_busy}
										>
											Delete
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
					<form
						class="admin-item-add"
						onsubmit={(event) => {
							event.preventDefault();
							void add_tweet_row();
						}}
					>
						<label class="admin-field">
							Content
							<textarea bind:value={new_tweet_content} rows="3" maxlength="350" required></textarea>
						</label>
						<button type="submit" data-intent="primary" disabled={ai_busy}>Add tweet</button>
					</form>
				</details>

				<details>
					<summary>Links ({ai_show_note.links.length})</summary>
					{#if ai_show_note.links.length === 0}
						<p class="admin-feedback">No links.</p>
					{:else}
						<ul class="admin-item-list">
							{#each ai_show_note.links as link_row (link_row.id)}
								<li>
									<label class="admin-field">
										Name
										<input type="text" bind:value={link_row.name} />
									</label>
									<label class="admin-field">
										URL
										<input type="url" bind:value={link_row.url} />
									</label>
									<label class="admin-field">
										Timestamp
										<input type="text" bind:value={link_row.timestamp} />
									</label>
									<div class="admin-actions">
										<button
											type="button"
											data-intent="primary"
											onclick={() => save_ai_link(link_row)}
											disabled={ai_busy}
										>
											Save
										</button>
										<button
											type="button"
											data-intent="danger"
											onclick={() => remove_ai_link(link_row.id)}
											disabled={ai_busy}
										>
											Delete
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
					<form
						class="admin-item-add"
						onsubmit={(event) => {
							event.preventDefault();
							void add_link_row();
						}}
					>
						<label class="admin-field">
							Name
							<input type="text" bind:value={new_link_name} required />
						</label>
						<label class="admin-field">
							URL
							<input type="url" bind:value={new_link_url} required />
						</label>
						<label class="admin-field">
							Timestamp
							<input type="text" bind:value={new_link_timestamp} />
						</label>
						<button type="submit" data-intent="primary" disabled={ai_busy}>Add link</button>
					</form>
				</details>

				<details>
					<summary>AI guests ({ai_show_note.guests.length})</summary>
					{#if ai_show_note.guests.length === 0}
						<p class="admin-feedback">No AI-detected guests.</p>
					{:else}
						<ul class="admin-item-list">
							{#each ai_show_note.guests as ai_guest_row (ai_guest_row.id)}
								<li>
									<label class="admin-field">
										Name
										<input type="text" bind:value={ai_guest_row.name} />
									</label>
									<div class="admin-actions">
										<button
											type="button"
											data-intent="primary"
											onclick={() => save_ai_guest(ai_guest_row)}
											disabled={ai_busy}
										>
											Save
										</button>
										<button
											type="button"
											data-intent="danger"
											onclick={() => remove_ai_guest_row(ai_guest_row.id)}
											disabled={ai_busy}
										>
											Delete
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
					<form
						class="admin-item-add"
						onsubmit={(event) => {
							event.preventDefault();
							void add_ai_guest_row();
						}}
					>
						<label class="admin-field">
							Name
							<input type="text" bind:value={new_ai_guest_name} required />
						</label>
						<button type="submit" data-intent="primary" disabled={ai_busy}>Add AI guest</button>
					</form>
				</details>

				<details>
					<summary>Topics ({ai_show_note.topics.length})</summary>
					{#if ai_show_note.topics.length === 0}
						<p class="admin-feedback">No topics.</p>
					{:else}
						<ul class="admin-item-list">
							{#each ai_show_note.topics as topic_row (topic_row.id)}
								<li>
									<label class="admin-field">
										Name
										<input type="text" bind:value={topic_row.name} />
									</label>
									<div class="admin-actions">
										<button
											type="button"
											data-intent="primary"
											onclick={() => save_topic(topic_row)}
											disabled={ai_busy}
										>
											Save
										</button>
										<button
											type="button"
											data-intent="danger"
											onclick={() => remove_topic_row(topic_row.id)}
											disabled={ai_busy}
										>
											Delete
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
					<form
						class="admin-item-add"
						onsubmit={(event) => {
							event.preventDefault();
							void add_topic_row();
						}}
					>
						<label class="admin-field">
							Name
							<input type="text" bind:value={new_topic_name} required />
						</label>
						<button type="submit" data-intent="primary" disabled={ai_busy}>Add topic</button>
					</form>
				</details>
			{/if}
		</section>
	</div>
{/if}
