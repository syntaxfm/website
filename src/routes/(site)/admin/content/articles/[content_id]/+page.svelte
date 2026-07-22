<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
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
		delete_article,
		get_article_authors,
		get_article_editor,
		update_article
	} from '../admin_articles.remote';
	import { get_tag_options } from '../../admin_content.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface ArticlePayload {
		content_id: string;
		title: string;
		slug: string;
		status: Status;
		published_at_iso: string | null;
		body: string;
		author_id: string;
		tag_ids?: string[];
	}

	interface ArticlePayloadOptions {
		tag_ids?: string[];
	}

	const content_id = (current_page.params as Record<string, string>).content_id ?? '';
	const article_item = await get_article_editor(content_id);
	const authors = await get_article_authors();
	const author_options = authors.map((author) => ({
		value: author.id,
		label: author.name || author.username || author.email || author.id
	}));
	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let title = $state(article_item?.meta.title ?? '');
	let slug = $state(article_item?.meta.slug ?? '');
	let status = $state<Status>((article_item?.meta.status ?? 'DRAFT') as Status);
	let published_at = $state<Date | null>(
		article_item?.meta.published_at ? new Date(article_item.meta.published_at) : null
	);
	let author_id = $state(article_item?.author_id ?? '');
	let body = $state(article_item?.body ?? '');
	let selected_tag_ids = $state(
		article_item?.meta.tags.map((content_tag) => content_tag.tag.id) ?? []
	);

	function create_article_payload({ tag_ids }: ArticlePayloadOptions = {}): ArticlePayload {
		return {
			content_id,
			title,
			slug,
			status,
			published_at_iso: published_at ? published_at.toISOString() : null,
			body,
			author_id,
			...(tag_ids !== undefined ? { tag_ids: [...tag_ids] } : {})
		};
	}

	const autosave = create_autosave_controller<ArticlePayload>(async (payload) => {
		try {
			await update_article(payload);
		} catch (error) {
			console.error('Unable to save article', error);
			throw error;
		}
	});

	function schedule_save(options?: ArticlePayloadOptions): void {
		autosave.schedule(create_article_payload(options));
	}

	function save_immediately(options?: ArticlePayloadOptions): void {
		schedule_save(options);
		void autosave.save_now();
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

	function handle_body_change(next_body: string): void {
		body = next_body;
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

	function handle_author_change(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLSelectElement)) {
			return;
		}

		author_id = target.value;
		save_immediately();
	}

	function handle_tags_change(next_tag_ids: string[]): void {
		selected_tag_ids = [...next_tag_ids];
		save_immediately({ tag_ids: selected_tag_ids });
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		await autosave.save_now();
	}

	async function handle_delete_article(): Promise<void> {
		if (!article_item) {
			throw new Error('Article not found.');
		}

		await autosave.save_now();
		await delete_article({ content_id: article_item.content_id, confirm_text: 'DELETE' });
		await goto(resolve('/admin/content/articles'));
	}

	onDestroy(() => autosave.cleanup());
</script>

<svelte:head>
	<title>Edit {title || content_id} | Syntax Admin</title>
</svelte:head>

{#if !article_item}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">Article not found.</p>
	</div>
{:else}
	<div class="admin-page stack">
		<AdminSaveStatus
			state={autosave.state}
			error_message={autosave.error_message}
			onretry={() => autosave.retry()}
		/>

		<form class="admin-editor-layout" onsubmit={handle_submit}>
			<div class="admin-editor-main">
				<div class="admin-field">
					<label for="article-title">Title</label>
					<input
						id="article-title"
						name="title"
						type="text"
						required
						bind:value={title}
						oninput={handle_title_input}
					/>
				</div>

				<SlugEditor bind:title bind:slug onchange={handle_slug_change} />
				<MarkdownEditor bind:value={body} onchange={handle_body_change} />
			</div>

			<aside class="admin-metadata-rail" aria-label="Article metadata">
				<StatusSelect bind:status onchange={handle_status_change} />
				<DateTimePicker bind:value={published_at} onchange={handle_published_at_change} />

				<div class="admin-field">
					<label for="article-author">Author</label>
					<select
						id="article-author"
						name="author_id"
						required
						bind:value={author_id}
						onchange={handle_author_change}
					>
						<option value="" disabled>Select author</option>
						{#each author_options as author (author.value)}
							<option value={author.value}>{author.label}</option>
						{/each}
					</select>
				</div>

				<MultiSelect
					options={tag_options}
					bind:selected_ids={selected_tag_ids}
					label="Tags"
					onchange={handle_tags_change}
				/>
			</aside>
		</form>

		<section class="admin-section admin-danger">
			<h2>Delete article</h2>
			<div class="admin-actions">
				<AdminConfirmDialog
					title="Delete article?"
					description="This permanently deletes the article."
					action_label="Delete article"
					onconfirm={handle_delete_article}
				/>
			</div>
		</section>
	</div>
{/if}
