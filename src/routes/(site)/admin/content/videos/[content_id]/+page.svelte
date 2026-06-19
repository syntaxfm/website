<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import {
		assign_content_tags,
		get_content_detail,
		get_tag_options,
		remove_content_tags
	} from '../../admin_content.remote';
	import { delete_video, update_video_meta } from '../admin_videos.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	const content_id = (page.params as Record<string, string>).content_id ?? '';
	const loaded_content_item = await get_content_detail(content_id);
	const initial_selected_tag_ids =
		loaded_content_item?.tags.map((content_tag) => content_tag.tag.id) ?? [];
	const initial_status = (loaded_content_item?.status ?? 'DRAFT') as Status;
	const initial_published_at = loaded_content_item?.published_at
		? new Date(loaded_content_item.published_at)
		: null;

	let content_item = $state(loaded_content_item);
	let status = $state<Status>(initial_status);
	let published_at = $state<Date | null>(initial_published_at);
	let selected_tag_ids = $state(initial_selected_tag_ids);
	let initial_tag_ids = $state([...initial_selected_tag_ids]);

	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let saving = $state(false);
	let deleting = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	let selected_tags_set = $derived(new Set(selected_tag_ids));
	let initial_tags_set = $derived(new Set(initial_tag_ids));

	let tags_to_add = $derived(selected_tag_ids.filter((tag_id) => !initial_tags_set.has(tag_id)));
	let tags_to_remove = $derived(initial_tag_ids.filter((tag_id) => !selected_tags_set.has(tag_id)));

	async function save_video() {
		if (!content_item) {
			status_error = 'Video not found.';
			return;
		}

		saving = true;
		status_message = '';
		status_error = '';

		try {
			await update_video_meta({
				content_id: content_item.id,
				status,
				published_at_iso: published_at ? published_at.toISOString() : null
			});

			if (tags_to_add.length > 0) {
				await assign_content_tags({
					content_ids: [content_item.id],
					tag_ids: tags_to_add
				});
			}

			if (tags_to_remove.length > 0) {
				await remove_content_tags({
					content_ids: [content_item.id],
					tag_ids: tags_to_remove
				});
			}

			content_item = await get_content_detail(content_id);
			initial_tag_ids = [...selected_tag_ids];
			status_message = 'Video updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save video.';
		} finally {
			saving = false;
		}
	}

	async function handle_delete_video() {
		if (!content_item) {
			status_error = 'Video not found.';
			return;
		}

		status_message = '';
		status_error = '';

		const confirm_text = window.prompt('Type DELETE to confirm deleting this video');
		if (confirm_text !== 'DELETE') {
			status_message = 'Delete cancelled.';
			return;
		}

		deleting = true;

		try {
			await delete_video({ content_id: content_item.id, confirm_text });
			await goto('/admin/content/videos');
		} catch (error) {
			console.error('Unable to delete video', error);
			status_error = error instanceof Error ? error.message : 'Unable to delete video.';
		} finally {
			deleting = false;
		}
	}
</script>

{#if !content_item}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Video not found</h1>
		<p><a href="/admin/content">Back to content list</a></p>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Edit Video</h1>

		<form
			class="stack readable"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_video();
			}}
		>
			<dl class="stack" style:--stack-gap="var(--pad-xsmall)">
				<dt class="fs-2">
					Title <span class="fs-1">imported from YouTube</span>
				</dt>
				<dd>{content_item.title}</dd>

				<dt class="fs-2">
					Slug <span class="fs-1">imported from YouTube</span>
				</dt>
				<dd>{content_item.slug}</dd>

				<dt class="fs-2">
					YouTube URL <span class="fs-1">imported from YouTube</span>
				</dt>
				<dd>
					{#if content_item.video?.url}
						<a href={content_item.video.url} target="_blank" rel="noopener noreferrer">
							{content_item.video.url}
						</a>
					{:else}
						—
					{/if}
				</dd>
			</dl>

			<StatusSelect bind:status />
			<DateTimePicker bind:value={published_at} />

			<MultiSelect options={tag_options} bind:selected_ids={selected_tag_ids} label="Tags" />

			<button type="submit" disabled={saving || deleting}
				>{saving ? 'Saving...' : 'Save Video'}</button
			>
		</form>

		{#if status_message}
			<p>{status_message}</p>
		{/if}

		{#if status_error}
			<p>{status_error}</p>
		{/if}

		<p><a href="/admin/content">Back to content list</a></p>

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Danger zone</h2>
			<div class="flex" style:--flex-gap="var(--pad-small)">
				<button type="button" onclick={handle_delete_video} disabled={saving || deleting}>
					{deleting ? 'Deleting...' : 'Delete Video'}
				</button>
				<a href="/admin/content/videos">Back to videos</a>
			</div>
		</section>
	</div>
{/if}
