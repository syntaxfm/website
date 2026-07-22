<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import AdminConfirmDialog from '$lib/admin/AdminConfirmDialog.svelte';
	import AdminSaveStatus from '$lib/admin/AdminSaveStatus.svelte';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '$lib/admin/MarkdownEditor.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import { create_autosave_controller } from '$lib/utils/autosave.svelte';
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
		search_videos,
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

	interface VideoItem {
		id: string;
		title: string;
		slug: string;
		url: string;
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
		video_ids?: string[];
		tag_ids?: string[];
	}

	type ShowRelationshipUpdate =
		| { relationship: 'guests'; ids: string[] }
		| { relationship: 'hosts'; ids: string[] }
		| { relationship: 'videos'; ids: string[] }
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

	const initial_video_lookup = Object.fromEntries(
		(show?.videos ?? []).map((show_video: { video: VideoItem }) => [
			show_video.video.id,
			show_video.video
		])
	);

	const initial_selected_guest_ids = (show?.guests ?? []).map(
		(show_guest: { guest_id: string }) => show_guest.guest_id
	);
	const initial_selected_video_ids = (show?.videos ?? []).map(
		(show_video: { video_id: string }) => show_video.video_id
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
	let selected_video_ids = $state<string[]>([...initial_selected_video_ids]);
	let selected_tag_ids = $state<string[]>([...initial_selected_tag_ids]);

	let guest_lookup = $state<Record<string, GuestItem>>(initial_guest_lookup);
	let video_lookup = $state<Record<string, VideoItem>>(initial_video_lookup);

	let guest_search_text = $state('');
	let video_search_text = $state('');
	let host_search_text = $state('');
	let guest_search_results = $state<GuestItem[]>([]);
	let video_search_results = $state<VideoItem[]>([]);
	let host_search_results = $state<HostUser[]>([]);

	let attached_hosts = $state<HostUser[]>(
		(show?.hosts ?? []).map((host_row: { user: HostUser }) => host_row.user)
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
	let is_searching_guests = $state(false);
	let is_searching_videos = $state(false);
	let is_searching_hosts = $state(false);
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

	function add_video(video: VideoItem) {
		if (selected_video_ids.includes(video.id)) {
			return;
		}

		video_lookup = {
			...video_lookup,
			[video.id]: video
		};
		selected_video_ids = [...selected_video_ids, video.id];
		save_immediately({ relationship: 'videos', ids: selected_video_ids });
	}

	function remove_video(video_id: string) {
		selected_video_ids = selected_video_ids.filter((id) => id !== video_id);
		save_immediately({ relationship: 'videos', ids: selected_video_ids });
	}

	async function run_guest_search() {
		if (!show) {
			return;
		}

		is_searching_guests = true;
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
		} finally {
			is_searching_guests = false;
		}
	}

	async function run_video_search() {
		if (!show) {
			return;
		}

		is_searching_videos = true;
		clear_feedback();

		try {
			const result = await search_videos({
				search_text: video_search_text.trim() || undefined,
				limit: 30
			});
			video_search_results = result;
			for (const video_item of result) {
				video_lookup = {
					...video_lookup,
					[video_item.id]: video_item
				};
			}
		} catch (error) {
			console.error(error);
			status_error = 'Unable to search videos.';
		} finally {
			is_searching_videos = false;
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
			case 'videos':
				return { ...payload, video_ids: [...relationship_update.ids] };
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

		is_searching_hosts = true;
		clear_feedback();

		try {
			const result = await search_users_for_host({
				search_text: host_search_text.trim() || undefined
			});
			host_search_results = result;
		} catch (error) {
			console.error(error);
			status_error = 'Unable to search users.';
		} finally {
			is_searching_hosts = false;
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
		<AdminSaveStatus
			state={autosave.state}
			error_message={autosave.error_message}
			onretry={() => autosave.retry()}
		/>

		{#if status_message}
			<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
		{/if}
		{#if status_error}
			<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
		{/if}

		<nav class="admin-section-nav" aria-label="Show editor sections">
			<a class="button" data-intent="quiet" href="#metadata">Metadata</a>
			<a class="button" data-intent="quiet" href="#people">People</a>
			<a class="button" data-intent="quiet" href="#media">Media</a>
			<a class="button" data-intent="quiet" href="#ai-notes">AI notes</a>
		</nav>

		<form class="admin-editor stack" onsubmit={handle_submit}>
			<section id="metadata" class="admin-section" aria-labelledby="metadata-heading">
				<h2 id="metadata-heading" class="h5">Metadata</h2>
				<div class="admin-editor-layout">
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

					<aside class="admin-metadata-rail" aria-label="Show metadata">
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
						{:else}
							<p class="admin-feedback">Tags require linked content.</p>
						{/if}
					</aside>
				</div>
			</section>

			<section id="people" class="admin-section" aria-labelledby="people-heading">
				<h2 id="people-heading" class="h5">People</h2>

				<h3>Guests</h3>
				<div class="admin-field">
					<label for="guest-search">Find guest</label>
					<div class="admin-control-row">
						<input
							id="guest-search"
							type="search"
							bind:value={guest_search_text}
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void run_guest_search();
								}
							}}
						/>
						<button
							type="button"
							data-intent="quiet"
							onclick={run_guest_search}
							disabled={is_searching_guests}
						>
							{is_searching_guests ? 'Searching…' : 'Search'}
						</button>
					</div>
				</div>

				{#if guest_search_results.length > 0}
					<ul class="no-list stack" aria-label="Guest search results">
						{#each guest_search_results as guest_item (guest_item.id)}
							<li class="admin-control-row">
								<span>{guest_item.name} /{guest_item.name_slug}</span>
								<button
									type="button"
									data-intent="primary"
									onclick={() => add_guest(guest_item)}
									disabled={selected_guest_ids.includes(guest_item.id)}
								>
									{selected_guest_ids.includes(guest_item.id) ? 'Added' : 'Add'}
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				{#if selected_guest_ids.length === 0}
					<p class="admin-feedback">No guests selected.</p>
				{:else}
					<ul class="no-list stack" aria-label="Selected guests">
						{#each selected_guest_ids as guest_id (guest_id)}
							<li class="admin-control-row">
								<span>{guest_lookup[guest_id]?.name ?? guest_id}</span>
								<button type="button" data-intent="quiet" onclick={() => remove_guest(guest_id)}
									>Remove</button
								>
							</li>
						{/each}
					</ul>
				{/if}

				<h3>Hosts</h3>
				<div class="admin-field">
					<label for="host-search">Find host</label>
					<div class="admin-control-row">
						<input
							id="host-search"
							type="search"
							bind:value={host_search_text}
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void run_host_search();
								}
							}}
						/>
						<button
							type="button"
							data-intent="quiet"
							onclick={run_host_search}
							disabled={is_searching_hosts}
						>
							{is_searching_hosts ? 'Searching…' : 'Search'}
						</button>
					</div>
				</div>

				{#if host_search_results.length > 0}
					<ul class="no-list stack" aria-label="Host search results">
						{#each host_search_results as candidate (candidate.id)}
							{@const already_attached = attached_hosts.some(
								(host_item) => host_item.id === candidate.id
							)}
							<li class="admin-control-row">
								<span>{host_label(candidate)}{candidate.email ? ` · ${candidate.email}` : ''}</span>
								<button
									type="button"
									data-intent="primary"
									onclick={() => attach_host(candidate)}
									disabled={already_attached}
								>
									{already_attached ? 'Attached' : 'Attach'}
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				{#if attached_hosts.length === 0}
					<p class="admin-feedback">No hosts attached.</p>
				{:else}
					<ul class="no-list stack" aria-label="Attached hosts">
						{#each attached_hosts as host_item (host_item.id)}
							<li class="admin-control-row">
								<span>{host_label(host_item)}</span>
								<button type="button" data-intent="quiet" onclick={() => detach_host(host_item.id)}
									>Remove</button
								>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section id="media" class="admin-section" aria-labelledby="media-heading">
				<div class="admin-control-row">
					<h2 id="media-heading" class="h5">Media</h2>
					<button
						type="button"
						data-intent="primary"
						onclick={sync_spotify}
						disabled={syncing_spotify}
					>
						{syncing_spotify ? 'Syncing Spotify…' : 'Sync Spotify'}
					</button>
				</div>

				<h3>Videos</h3>
				<div class="admin-field">
					<label for="video-search">Find video</label>
					<div class="admin-control-row">
						<input
							id="video-search"
							type="search"
							bind:value={video_search_text}
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void run_video_search();
								}
							}}
						/>
						<button
							type="button"
							data-intent="quiet"
							onclick={run_video_search}
							disabled={is_searching_videos}
						>
							{is_searching_videos ? 'Searching…' : 'Search'}
						</button>
					</div>
				</div>

				{#if video_search_results.length > 0}
					<ul class="no-list stack" aria-label="Video search results">
						{#each video_search_results as video_item (video_item.id)}
							<li class="admin-control-row">
								<span>{video_item.title} /{video_item.slug}</span>
								<button
									type="button"
									data-intent="primary"
									onclick={() => add_video(video_item)}
									disabled={selected_video_ids.includes(video_item.id)}
								>
									{selected_video_ids.includes(video_item.id) ? 'Added' : 'Add'}
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				{#if selected_video_ids.length === 0}
					<p class="admin-feedback">No videos selected.</p>
				{:else}
					<ul class="no-list stack" aria-label="Selected videos">
						{#each selected_video_ids as video_id (video_id)}
							<li class="admin-control-row">
								<span>{video_lookup[video_id]?.title ?? video_id}</span>
								<button type="button" data-intent="quiet" onclick={() => remove_video(video_id)}
									>Remove</button
								>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</form>

		<section id="ai-notes" class="admin-section" aria-labelledby="ai-notes-heading">
			<h2 id="ai-notes-heading" class="h5">AI Notes</h2>

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
					<input type="hidden" name="n:show_number" value={show.number} />
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
					<input type="hidden" name="n:show_number" value={show.number} />
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
						<ul class="no-list stack">
							{#each ai_show_note.summary as entry (entry.id)}
								<li class="stack">
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
						class="stack"
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
						<ul class="no-list stack">
							{#each ai_show_note.tweets as tweet (tweet.id)}
								<li class="stack">
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
						class="stack"
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
						<ul class="no-list stack">
							{#each ai_show_note.links as link_row (link_row.id)}
								<li class="stack">
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
						class="stack"
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
						<ul class="no-list stack">
							{#each ai_show_note.guests as ai_guest_row (ai_guest_row.id)}
								<li class="stack">
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
						class="stack"
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
						<ul class="no-list stack">
							{#each ai_show_note.topics as topic_row (topic_row.id)}
								<li class="stack">
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
						class="stack"
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
