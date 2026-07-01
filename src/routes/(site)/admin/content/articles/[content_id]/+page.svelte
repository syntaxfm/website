<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '$lib/admin/MarkdownEditor.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import {
		delete_article,
		get_article_authors,
		get_article_editor,
		update_article
	} from '../admin_articles.remote';
	import {
		assign_content_tags,
		get_tag_options,
		remove_content_tags
	} from '../../admin_content.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	const content_id = (current_page.params as Record<string, string>).content_id ?? '';
	const loaded_article_item = await get_article_editor(content_id);
	const initial_title = loaded_article_item?.meta.title ?? '';
	const initial_slug = loaded_article_item?.meta.slug ?? '';
	const initial_status = (loaded_article_item?.meta.status ?? 'DRAFT') as Status;
	const initial_published_at = loaded_article_item?.meta.published_at
		? new Date(loaded_article_item.meta.published_at)
		: null;
	const initial_author_id = loaded_article_item?.author_id ?? '';
	const initial_body = loaded_article_item?.body ?? '';
	const initial_selected_tag_ids =
		loaded_article_item?.meta.tags.map((content_tag) => content_tag.tag.id) ?? [];
	const authors = await get_article_authors();
	const author_options = authors.map((author) => ({
		value: author.id,
		label: author.name || author.username || author.email || author.id
	}));
	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let article_item = $state(loaded_article_item);
	let title = $state(initial_title);
	let slug = $state(initial_slug);
	let status = $state<Status>(initial_status);
	let published_at = $state<Date | null>(initial_published_at);
	let author_id = $derived.by(() => {
		const author_id_param = current_page.url.searchParams.get('author_id');
		if (!author_id_param) {
			return initial_author_id;
		}

		return author_options.some((option) => option.value === author_id_param)
			? author_id_param
			: initial_author_id;
	});
	let selected_author_label = $derived.by(
		() => author_options.find((option) => option.value === author_id)?.label ?? 'Select author'
	);
	let body = $state(initial_body);
	let selected_tag_ids = $state(initial_selected_tag_ids);
	let initial_tag_ids = $state([...initial_selected_tag_ids]);

	let selected_tags_set = $derived(new Set(selected_tag_ids));
	let initial_tags_set = $derived(new Set(initial_tag_ids));

	let tags_to_add = $derived(selected_tag_ids.filter((tag_id) => !initial_tags_set.has(tag_id)));
	let tags_to_remove = $derived(initial_tag_ids.filter((tag_id) => !selected_tags_set.has(tag_id)));

	let saving = $state(false);
	let deleting = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	async function save_article() {
		if (!article_item) {
			status_error = 'Article not found.';
			return;
		}

		if (!author_id) {
			status_error = 'Author is required.';
			return;
		}

		saving = true;
		status_message = '';
		status_error = '';

		try {
			await update_article({
				content_id: article_item.content_id,
				title,
				slug,
				status,
				published_at_iso: published_at ? published_at.toISOString() : null,
				body,
				author_id
			});

			if (tags_to_add.length > 0) {
				await assign_content_tags({
					content_ids: [article_item.content_id],
					tag_ids: tags_to_add
				});
			}

			if (tags_to_remove.length > 0) {
				await remove_content_tags({
					content_ids: [article_item.content_id],
					tag_ids: tags_to_remove
				});
			}

			article_item = await get_article_editor(content_id);
			initial_tag_ids = [...selected_tag_ids];
			status_message = 'Article updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save article.';
		} finally {
			saving = false;
		}
	}

	async function handle_delete_article() {
		if (!article_item) {
			status_error = 'Article not found.';
			return;
		}

		status_message = '';
		status_error = '';

		const confirm_text = window.prompt('Type DELETE to confirm deleting this article');
		if (confirm_text !== 'DELETE') {
			status_message = 'Delete cancelled.';
			return;
		}

		deleting = true;

		try {
			await delete_article({ content_id: article_item.content_id, confirm_text });
			await goto(resolve('/admin/content/articles'));
		} catch (error) {
			console.error('Unable to delete article', error);
			status_error = error instanceof Error ? error.message : 'Unable to delete article.';
		} finally {
			deleting = false;
		}
	}
</script>

{#if !article_item}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Article not found</h1>
		<p><a href={resolve(`/admin/content/${content_id}`)}>Back to content shell</a></p>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Article Editor</h1>

		<form
			class="stack readable"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_article();
			}}
		>
			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Title</span>
				<input type="text" bind:value={title} required />
			</label>

			<SlugEditor bind:title bind:slug />
			<StatusSelect bind:status />
			<DateTimePicker bind:value={published_at} />

			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Author</span>
				<SelectMenu
					popover_id="filter-author_id"
					button_text={`Author (${selected_author_label})`}
					button_icon="filter"
					value={author_id}
					options={author_options}
				/>
			</label>

			<MultiSelect options={tag_options} bind:selected_ids={selected_tag_ids} label="Tags" />

			<MarkdownEditor bind:value={body} />

			<button type="submit" disabled={saving || deleting}
				>{saving ? 'Saving...' : 'Save Article'}</button
			>
		</form>

		{#if status_message}
			<p>{status_message}</p>
		{/if}

		{#if status_error}
			<p>{status_error}</p>
		{/if}

		<p><a href={resolve(`/admin/content/${content_id}`)}>Back to content shell</a></p>

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Danger zone</h2>
			<div class="flex" style:--flex-gap="var(--pad-small)">
				<button type="button" onclick={handle_delete_article} disabled={saving || deleting}>
					{deleting ? 'Deleting...' : 'Delete Article'}
				</button>
				<a href={resolve('/admin/content/articles')}>Back to articles</a>
			</div>
		</section>
	</div>
{/if}
