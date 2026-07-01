<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
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

	const playlist_id = (page.params as Record<string, string>).id ?? '';
	let playlist_detail = $state(await get_playlist_detail(playlist_id));

	let title = $state(playlist_detail?.title ?? '');
	let slug = $state(playlist_detail?.slug ?? '');

	let video_search_text = $state('');
	let video_search_results = $state<VideoSearchResult[]>([]);

	let saving = $state(false);
	let deleting = $state(false);
	let mutating_video = $state(false);
	let is_searching_videos = $state(false);

	let status_message = $state('');
	let status_error = $state('');

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	async function refresh_detail() {
		await get_playlist_detail(playlist_id).refresh();
		const next_detail = await get_playlist_detail(playlist_id);
		playlist_detail = next_detail;
	}

	async function save_playlist() {
		if (!playlist_detail) {
			status_error = 'Playlist not found.';
			return;
		}

		saving = true;
		clear_feedback();

		try {
			await update_playlist({
				id: playlist_detail.id,
				title,
				slug
			});

			await refresh_detail();
			status_message = 'Playlist updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save playlist.';
		} finally {
			saving = false;
		}
	}

	async function delete_current_playlist() {
		if (!playlist_detail) {
			return;
		}

		clear_feedback();

		const confirm_text = window.prompt(
			'Type DELETE to confirm deleting this playlist. Attached video links will also be removed.'
		);

		if (confirm_text !== 'DELETE') {
			status_message = 'Delete cancelled.';
			return;
		}

		deleting = true;

		try {
			await delete_playlist(playlist_detail.id);
			await goto(resolve('/admin/content/videos/playlists'));
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to delete playlist.';
			deleting = false;
		}
	}

	async function run_video_search(next_value: string) {
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
			console.error(error);
			status_error = 'Unable to search videos.';
		} finally {
			is_searching_videos = false;
		}
	}

	async function attach_video(video_id: string) {
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
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to attach video.';
		} finally {
			mutating_video = false;
		}
	}

	async function detach_video(video_id: string) {
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
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove video.';
		} finally {
			mutating_video = false;
		}
	}
</script>

{#if !playlist_detail}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Playlist not found</h1>
		<p><a href={resolve('/admin/content/videos/playlists')}>Back to playlists</a></p>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-medium)">
		<div class="split" style="flex-wrap: wrap">
			<h1 class="h3">Edit Playlist</h1>
			<a class="button small" href={resolve('/admin/content/videos/playlists')}>Back to playlists</a
			>
		</div>

		<form
			class="stack"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_playlist();
			}}
		>
			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Title</span>
				<input type="text" bind:value={title} required />
			</label>

			<SlugEditor bind:title bind:slug />

			<div class="flex" style:--flex-gap="var(--pad-small)">
				<button type="submit" disabled={saving || deleting}>
					{saving ? 'Saving...' : 'Save'}
				</button>
				<button type="button" onclick={delete_current_playlist} disabled={saving || deleting}>
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</form>

		{#if status_message}
			<p class="fs-2" style="color: var(--c-green)">{status_message}</p>
		{/if}

		{#if status_error}
			<p class="fs-2" style="color: var(--c-red)">{status_error}</p>
		{/if}

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Videos in this playlist</h2>

			{#if playlist_detail.videos.length === 0}
				<p class="fs-2">No videos attached.</p>
			{:else}
				<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
					{#each playlist_detail.videos as playlist_video (playlist_video.video_id)}
						<li class="split" style:--split-gap="var(--pad-small)">
							<div class="stack" style:--stack-gap="0.25rem">
								<p>{playlist_video.video.meta?.title ?? playlist_video.video.title}</p>
								<p class="fs-2">/{playlist_video.video.meta?.slug ?? playlist_video.video.slug}</p>
							</div>
							<button
								type="button"
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

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Attach videos</h2>

			<AdminSearch
				text={video_search_text}
				on_input={run_video_search}
				placeholder="Search videos"
			/>

			{#if is_searching_videos}
				<p class="fs-2">Searching...</p>
			{:else if video_search_results.length === 0}
				<p class="fs-2">No matching videos.</p>
			{:else}
				<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
					{#each video_search_results as video_item (video_item.id)}
						<li class="split" style:--split-gap="var(--pad-small)">
							<div class="stack" style:--stack-gap="0.25rem">
								<p>{video_item.title}</p>
								<p class="fs-2">/{video_item.slug}</p>
							</div>
							<button
								type="button"
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
	</div>
{/if}
