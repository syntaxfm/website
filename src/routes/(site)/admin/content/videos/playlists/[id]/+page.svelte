<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import AdminConfirmDialog from '$lib/admin/AdminConfirmDialog.svelte';
	import AdminSaveStatus from '$lib/admin/AdminSaveStatus.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import { create_autosave_controller } from '$lib/utils/autosave.svelte';
	import AdminSearch from '../../../../AdminSearch.svelte';
	import {
		add_video_to_playlist,
		delete_playlist,
		get_playlist_detail,
		remove_video_from_playlist,
		search_videos_for_playlist,
		update_playlist
	} from '../admin_playlists.remote';

	interface VideoSearchResult {
		id: string;
		title: string;
		slug: string;
		url: string;
		published_at: Date;
	}

	interface PlaylistSnapshot {
		id: string;
		title: string;
		slug: string;
	}

	const playlist_id = (page.params as Record<string, string>).id ?? '';
	const initial_playlist_detail = await get_playlist_detail(playlist_id);
	let playlist_detail = $state(initial_playlist_detail);

	let title = $state(initial_playlist_detail?.title ?? '');
	let slug = $state(initial_playlist_detail?.slug ?? '');

	let video_search_text = $state('');
	let video_search_results = $state<VideoSearchResult[]>([]);

	let mutating_video = $state(false);
	let is_searching_videos = $state(false);

	let status_message = $state('');
	let status_error = $state('');

	const autosave = create_autosave_controller<PlaylistSnapshot>(async (snapshot) => {
		try {
			await update_playlist(snapshot);
		} catch (error) {
			console.error('Unable to autosave playlist', error);
			throw error;
		}
	});

	onDestroy(() => autosave.cleanup());

	function clear_feedback(): void {
		status_message = '';
		status_error = '';
	}

	function create_playlist_snapshot(): PlaylistSnapshot | null {
		if (!playlist_detail) {
			return null;
		}

		return {
			id: playlist_detail.id,
			title,
			slug
		};
	}

	function schedule_save(): void {
		const snapshot = create_playlist_snapshot();
		if (snapshot) {
			autosave.schedule(snapshot);
		}
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

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		await autosave.save_now();
	}

	async function refresh_detail(): Promise<void> {
		await get_playlist_detail(playlist_id).refresh();
		const next_detail = await get_playlist_detail(playlist_id);
		playlist_detail = next_detail;
	}

	async function delete_current_playlist(): Promise<void> {
		if (!playlist_detail) {
			throw new Error('Playlist not found.');
		}

		clear_feedback();
		await autosave.save_now();

		try {
			await delete_playlist(playlist_detail.id);
			await goto(resolve('/admin/content/videos/playlists'));
		} catch (error) {
			console.error('Unable to delete playlist', error);
			status_error = error instanceof Error ? error.message : 'Unable to delete playlist.';
			throw error;
		}
	}

	async function run_video_search(next_value: string): Promise<void> {
		if (!playlist_detail) {
			return;
		}

		video_search_text = next_value;
		is_searching_videos = true;
		clear_feedback();

		try {
			const result = await search_videos_for_playlist({
				playlist_id: playlist_detail.id,
				search_text: next_value.trim() || undefined
			});
			video_search_results = result;
		} catch (error) {
			console.error('Unable to search videos for playlist', error);
			status_error = 'Unable to search videos.';
		} finally {
			is_searching_videos = false;
		}
	}

	async function attach_video(video_id: string): Promise<void> {
		if (!playlist_detail) {
			return;
		}

		mutating_video = true;
		clear_feedback();

		try {
			await add_video_to_playlist({
				playlist_id: playlist_detail.id,
				video_id
			});
			video_search_results = video_search_results.filter((item) => item.id !== video_id);
			await refresh_detail();
			status_message = 'Video attached.';
		} catch (error) {
			console.error('Unable to attach video to playlist', error);
			status_error = error instanceof Error ? error.message : 'Unable to attach video.';
		} finally {
			mutating_video = false;
		}
	}

	async function detach_video(video_id: string): Promise<void> {
		if (!playlist_detail) {
			return;
		}

		mutating_video = true;
		clear_feedback();

		try {
			await remove_video_from_playlist({
				playlist_id: playlist_detail.id,
				video_id
			});
			await refresh_detail();
			status_message = 'Video removed.';
		} catch (error) {
			console.error('Unable to remove video from playlist', error);
			status_error = error instanceof Error ? error.message : 'Unable to remove video.';
		} finally {
			mutating_video = false;
		}
	}
</script>

<svelte:head>
	<title
		>{playlist_detail ? `Edit playlist: ${title || playlist_id}` : 'Playlist not found'} | Syntax Admin</title
	>
</svelte:head>

{#if !playlist_detail}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">Playlist not found.</p>
	</div>
{:else}
	<div class="admin-page stack">
		<AdminSaveStatus
			state={autosave.state}
			error_message={autosave.error_message}
			onretry={() => autosave.retry()}
		/>

		<form class="admin-editor stack" onsubmit={handle_submit}>
			<section class="admin-section" aria-labelledby="playlist-details-heading">
				<h2 id="playlist-details-heading" class="h5">Playlist details</h2>
				<div class="admin-editor-main">
					<div class="admin-field">
						<label for="playlist-title">Title</label>
						<input
							id="playlist-title"
							name="title"
							type="text"
							bind:value={title}
							oninput={handle_title_input}
							required
						/>
					</div>

					<SlugEditor bind:title bind:slug onchange={handle_slug_change} />
				</div>
			</section>
		</form>

		{#if status_message}
			<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
		{/if}

		{#if status_error}
			<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
		{/if}

		<section class="admin-section" aria-labelledby="playlist-videos-heading">
			<h2 id="playlist-videos-heading" class="h5">Videos in this playlist</h2>

			{#if playlist_detail.videos.length === 0}
				<p class="admin-feedback">No videos attached.</p>
			{:else}
				<ul class="no-list">
					{#each playlist_detail.videos as playlist_video (playlist_video.video_id)}
						<li class="admin-row">
							<div class="admin-control">
								<span>{playlist_video.video.meta?.title ?? playlist_video.video.title}</span>
								<span class="admin-source-note"
									>/{playlist_video.video.meta?.slug ?? playlist_video.video.slug}</span
								>
							</div>
							<button
								type="button"
								data-intent="quiet"
								onclick={() => detach_video(playlist_video.video_id)}
								disabled={mutating_video}
							>
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="admin-section" aria-labelledby="attach-videos-heading">
			<h2 id="attach-videos-heading" class="h5">Attach videos</h2>

			<AdminSearch
				text={video_search_text}
				on_input={run_video_search}
				placeholder="Search videos"
				label="Search videos to attach"
			/>

			{#if is_searching_videos}
				<p class="admin-feedback" role="status">Searching…</p>
			{:else if video_search_results.length === 0}
				<p class="admin-feedback">No matching videos.</p>
			{:else}
				<ul class="no-list">
					{#each video_search_results as video_item (video_item.id)}
						<li class="admin-row">
							<div class="admin-control">
								<span>{video_item.title}</span>
								<span class="admin-source-note">/{video_item.slug}</span>
							</div>
							<button
								type="button"
								data-intent="primary"
								onclick={() => attach_video(video_item.id)}
								disabled={mutating_video}
							>
								Attach
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="admin-section admin-danger" aria-labelledby="delete-playlist-heading">
			<h2 id="delete-playlist-heading" class="h5">Delete playlist</h2>
			<p>Permanently delete this playlist and remove its attached video links.</p>
			<div class="admin-actions">
				<AdminConfirmDialog
					title="Delete playlist?"
					description="This permanently deletes the playlist and removes its attached video links."
					action_label="Delete playlist"
					onconfirm={delete_current_playlist}
				/>
			</div>
		</section>
	</div>
{/if}
