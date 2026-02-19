<script lang="ts">
	import { page } from '$app/state';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import {
		assign_content_tags,
		get_content_detail,
		get_tag_options,
		remove_content_tags,
		update_content_meta
	} from '../admin_content.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	const content_id = (page.params as Record<string, string>).content_id ?? '';
	const loaded_content_item = await get_content_detail(content_id);
	const initial_title = loaded_content_item?.title ?? '';
	const initial_slug = loaded_content_item?.slug ?? '';
	const initial_status = (loaded_content_item?.status ?? 'DRAFT') as Status;
	const initial_published_at = loaded_content_item?.published_at
		? new Date(loaded_content_item.published_at)
		: null;
	const initial_selected_tag_ids =
		loaded_content_item?.tags.map((content_tag) => content_tag.tag.id) ?? [];

	let content_item = $state(loaded_content_item);
	let title = $state(initial_title);
	let slug = $state(initial_slug);
	let status = $state<Status>(initial_status);
	let published_at = $state<Date | null>(initial_published_at);
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

	async function save_content() {
		if (!content_item) {
			status_error = 'Content not found.';
			return;
		}

		saving = true;
		status_message = '';
		status_error = '';

		try {
			await update_content_meta({
				content_id: content_item.id,
				title,
				slug,
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
			status_message = 'Content updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save content changes.';
		} finally {
			saving = false;
		}
	}
</script>

{#if !content_item}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Content not found</h1>
		<p><a href="/admin/content">Back to content list</a></p>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Edit Content</h1>

		<div class="stack" style:--stack-gap="var(--pad-xsmall)">
			<a href={`/preview/${content_item.id}`} target="_blank" rel="noopener noreferrer">Preview</a>
			{#if content_item.type === 'ARTICLE'}
				<a href={`/admin/content/${content_item.id}/article`}>Open Article Editor</a>
			{:else if content_item.type === 'PODCAST' && content_item.show}
				<a href={`/admin/content/podcast/${content_item.show.number}`}>Open Show Editor</a>
			{:else if content_item.type === 'VIDEO'}
				<p class="fs-2">YouTube is the source of truth. Video metadata is import-driven.</p>
			{/if}
		</div>

		<form
			class="stack readable"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_content();
			}}
		>
			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Title</span>
				<input type="text" bind:value={title} required />
			</label>

			<SlugEditor bind:title bind:slug />
			<StatusSelect bind:status />
			<DateTimePicker bind:value={published_at} />

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
