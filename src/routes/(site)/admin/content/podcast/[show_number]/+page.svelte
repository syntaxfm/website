<script lang="ts">
	import { page } from '$app/state';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '$lib/admin/MarkdownEditor.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import {
		add_show_guest,
		add_show_video,
		get_show_editor,
		remove_show_guest,
		remove_show_video,
		search_guests,
		search_videos,
		sync_spotify_for_show,
		update_show_editor
	} from '../admin_podcast.remote';
	import {
		assign_content_tags,
		get_tag_options,
		remove_content_tags
	} from '../../admin_content.remote';

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

	let initial_guest_ids = $state([...initial_selected_guest_ids]);
	let initial_video_ids = $state([...initial_selected_video_ids]);
	let initial_tag_ids = $state([...initial_selected_tag_ids]);

	let guest_lookup = $state<Record<string, GuestItem>>(initial_guest_lookup);
	let video_lookup = $state<Record<string, VideoItem>>(initial_video_lookup);

	let guest_search_text = $state('');
	let video_search_text = $state('');
	let guest_search_results = $state<GuestItem[]>([]);
	let video_search_results = $state<VideoItem[]>([]);

	const tag_options = (await get_tag_options()).map((tag_item: TagOption) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let saving = $state(false);
	let syncing_spotify = $state(false);
	let is_searching_guests = $state(false);
	let is_searching_videos = $state(false);

	let status_message = $state('');
	let status_error = $state('');

	let selected_guests_set = $derived(new Set(selected_guest_ids));
	let initial_guests_set = $derived(new Set(initial_guest_ids));
	let selected_videos_set = $derived(new Set(selected_video_ids));
	let initial_videos_set = $derived(new Set(initial_video_ids));
	let selected_tags_set = $derived(new Set(selected_tag_ids));
	let initial_tags_set = $derived(new Set(initial_tag_ids));

	let guest_ids_to_add = $derived(
		selected_guest_ids.filter((guest_id) => !initial_guests_set.has(guest_id))
	);
	let guest_ids_to_remove = $derived(
		initial_guest_ids.filter((guest_id) => !selected_guests_set.has(guest_id))
	);

	let video_ids_to_add = $derived(
		selected_video_ids.filter((video_id) => !initial_videos_set.has(video_id))
	);
	let video_ids_to_remove = $derived(
		initial_video_ids.filter((video_id) => !selected_videos_set.has(video_id))
	);

	let tag_ids_to_add = $derived(selected_tag_ids.filter((tag_id) => !initial_tags_set.has(tag_id)));
	let tag_ids_to_remove = $derived(
		initial_tag_ids.filter((tag_id) => !selected_tags_set.has(tag_id))
	);

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
	}

	function remove_guest(guest_id: string) {
		selected_guest_ids = selected_guest_ids.filter((id) => id !== guest_id);
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
	}

	function remove_video(video_id: string) {
		selected_video_ids = selected_video_ids.filter((id) => id !== video_id);
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

	async function save_show() {
		if (!show) {
			status_error = 'Show not found.';
			return;
		}

		saving = true;
		clear_feedback();

		try {
			await update_show_editor({
				show_number: show.number,
				title,
				slug,
				status,
				published_at_iso: published_at ? published_at.toISOString() : null,
				show_notes,
				url,
				youtube_url: youtube_url.trim() || null
			});

			for (const guest_id of guest_ids_to_add) {
				await add_show_guest({
					show_id: show.id,
					guest_id
				});
			}

			for (const guest_id of guest_ids_to_remove) {
				await remove_show_guest({
					show_id: show.id,
					guest_id
				});
			}

			for (const video_id of video_ids_to_add) {
				await add_show_video({
					show_id: show.id,
					video_id
				});
			}

			for (const video_id of video_ids_to_remove) {
				await remove_show_video({
					show_id: show.id,
					video_id
				});
			}

			if (show.meta?.id) {
				if (tag_ids_to_add.length > 0) {
					await assign_content_tags({
						content_ids: [show.meta.id],
						tag_ids: tag_ids_to_add
					});
				}

				if (tag_ids_to_remove.length > 0) {
					await remove_content_tags({
						content_ids: [show.meta.id],
						tag_ids: tag_ids_to_remove
					});
				}
			}

			initial_guest_ids = [...selected_guest_ids];
			initial_video_ids = [...selected_video_ids];
			initial_tag_ids = [...selected_tag_ids];
			status_message = 'Show updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save show changes.';
		} finally {
			saving = false;
		}
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
</script>

{#if !show}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Show not found</h1>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Edit Show #{show.number}</h1>

		<div class="flex" style:--flex-gap="var(--pad-small)">
			<button type="button" onclick={sync_spotify} disabled={syncing_spotify || saving}>
				{syncing_spotify ? 'Syncing Spotify...' : 'Sync Spotify'}
			</button>
			{#if show.meta?.id}
				<a href={`/preview/${show.meta.id}`} target="_blank" rel="noopener noreferrer">Preview</a>
			{/if}
		</div>

		<p class="fs-2">
			YouTube is the source of truth for video metadata. Associations here are local and metadata is
			import-driven.
		</p>

		<form
			class="stack"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_show();
			}}
		>
			<label class="stack" style:--stack-gap="0.35rem">
				Title
				<input type="text" bind:value={title} required />
			</label>

			<SlugEditor bind:title bind:slug />
			<StatusSelect bind:status />
			<DateTimePicker bind:value={published_at} label="Published at" />

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

			{#if show.meta?.id}
				<MultiSelect options={tag_options} bind:selected_ids={selected_tag_ids} label="Tags" />
			{:else}
				<p class="fs-2">Tags are available once this show has a linked content record.</p>
			{/if}

			<section class="stack" style:--stack-gap="var(--pad-small)">
				<h2 class="h5">Guests</h2>
				<div class="stack" style:--stack-gap="var(--pad-xsmall)">
					<input
						type="search"
						bind:value={guest_search_text}
						placeholder="Search guests"
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								void run_guest_search();
							}
						}}
					/>
					<button type="button" onclick={run_guest_search} disabled={is_searching_guests || saving}>
						{is_searching_guests ? 'Searching...' : 'Search'}
					</button>
				</div>

				{#if guest_search_results.length > 0}
					<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
						{#each guest_search_results as guest_item (guest_item.id)}
							<li class="split" style:--split-gap="var(--pad-small)">
								<div class="stack" style:--stack-gap="0.25rem">
									<p>{guest_item.name}</p>
									<p class="fs-2">/{guest_item.name_slug}</p>
								</div>
								<button
									type="button"
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
					<p class="fs-2">No guests selected.</p>
				{:else}
					<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
						{#each selected_guest_ids as guest_id (guest_id)}
							<li class="split" style:--split-gap="var(--pad-small)">
								<span>{guest_lookup[guest_id]?.name ?? guest_id}</span>
								<button type="button" onclick={() => remove_guest(guest_id)}>Remove</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="stack" style:--stack-gap="var(--pad-small)">
				<h2 class="h5">Associated videos</h2>
				<div class="stack" style:--stack-gap="var(--pad-xsmall)">
					<input
						type="search"
						bind:value={video_search_text}
						placeholder="Search videos"
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								void run_video_search();
							}
						}}
					/>
					<button type="button" onclick={run_video_search} disabled={is_searching_videos || saving}>
						{is_searching_videos ? 'Searching...' : 'Search'}
					</button>
				</div>

				{#if video_search_results.length > 0}
					<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
						{#each video_search_results as video_item (video_item.id)}
							<li class="split" style:--split-gap="var(--pad-small)">
								<div class="stack" style:--stack-gap="0.25rem">
									<p>{video_item.title}</p>
									<p class="fs-2">/{video_item.slug}</p>
								</div>
								<button
									type="button"
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
					<p class="fs-2">No videos selected.</p>
				{:else}
					<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
						{#each selected_video_ids as video_id (video_id)}
							<li class="split" style:--split-gap="var(--pad-small)">
								<span>{video_lookup[video_id]?.title ?? video_id}</span>
								<button type="button" onclick={() => remove_video(video_id)}>Remove</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<button type="submit" disabled={saving || syncing_spotify}>
				{saving ? 'Saving...' : 'Save'}
			</button>
		</form>

		{#if status_message}
			<p>{status_message}</p>
		{/if}

		{#if status_error}
			<p>{status_error}</p>
		{/if}
	</div>
{/if}
