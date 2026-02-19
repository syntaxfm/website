<script lang="ts">
	import { page as current_page } from '$app/state';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MarkdownEditor from '$lib/admin/MarkdownEditor.svelte';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import {
		get_article_authors,
		get_article_editor,
		update_article
	} from '../../../articles/admin_articles.remote';

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
	const authors = await get_article_authors();
	const author_options = authors.map((author) => ({
		value: author.id,
		label: author.name || author.username || author.email || author.id
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

	let saving = $state(false);
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

			article_item = await get_article_editor(content_id);
			status_message = 'Article updated.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to save article.';
		} finally {
			saving = false;
		}
	}
</script>

{#if !article_item}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Article not found</h1>
		<p><a href={`/admin/content/${content_id}`}>Back to content shell</a></p>
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
					button_icon={'filter' as any}
					value={author_id}
					options={author_options}
				/>
			</label>

			<MarkdownEditor bind:value={body} />

			<button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Article'}</button>
		</form>

		{#if status_message}
			<p>{status_message}</p>
		{/if}

		{#if status_error}
			<p>{status_error}</p>
		{/if}

		<p><a href={`/admin/content/${content_id}`}>Back to content shell</a></p>
	</div>
{/if}
