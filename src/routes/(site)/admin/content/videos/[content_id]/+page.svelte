<script lang="ts">
	import { page } from '$app/state';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import {
		assign_content_tags,
		get_content_detail,
		get_tag_options,
		remove_content_tags
	} from '../../admin_content.remote';

	const content_id = (page.params as Record<string, string>).content_id ?? '';
	const loaded_content_item = await get_content_detail(content_id);
	const initial_selected_tag_ids =
		loaded_content_item?.tags.map((content_tag) => content_tag.tag.id) ?? [];

	let content_item = $state(loaded_content_item);
	let selected_tag_ids = $state(initial_selected_tag_ids);
	let initial_tag_ids = $state([...initial_selected_tag_ids]);

	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let saving = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	let selected_tags_set = $derived(new Set(selected_tag_ids));
	let initial_tags_set = $derived(new Set(initial_tag_ids));

	let tags_to_add = $derived(selected_tag_ids.filter((tag_id) => !initial_tags_set.has(tag_id)));
	let tags_to_remove = $derived(initial_tag_ids.filter((tag_id) => !selected_tags_set.has(tag_id)));

	async function save_tags() {
		if (!content_item) {
			status_error = 'Content not found.';
			return;
		}

		saving = true;
		status_message = '';
		status_error = '';

		try {
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
			status_message = 'Tags updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save tag changes.';
		} finally {
			saving = false;
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

		<p class="fs-2">YouTube is the source of truth. Video metadata is import-driven.</p>

		<dl class="stack" style:--stack-gap="var(--pad-xsmall)">
			<dt class="fs-2">Title</dt>
			<dd>{content_item.title}</dd>

			<dt class="fs-2">Slug</dt>
			<dd>{content_item.slug}</dd>

			<dt class="fs-2">Status</dt>
			<dd>{content_item.status}</dd>

			<dt class="fs-2">Published at</dt>
			<dd>
				{content_item.published_at ? new Date(content_item.published_at).toISOString() : '—'}
			</dd>

			<dt class="fs-2">YouTube URL</dt>
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

		<form
			class="stack readable"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_tags();
			}}
		>
			<MultiSelect options={tag_options} bind:selected_ids={selected_tag_ids} label="Tags" />

			<button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
		</form>

		{#if status_message}
			<p>{status_message}</p>
		{/if}

		{#if status_error}
			<p>{status_error}</p>
		{/if}

		<p><a href="/admin/content">Back to content list</a></p>
	</div>
{/if}
