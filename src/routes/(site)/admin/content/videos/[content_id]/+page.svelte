<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import MultiSelect from '#lib/admin/MultiSelect.svelte';
	import StatusSelect from '#lib/admin/StatusSelect.svelte';
	import { create_autosave_controller } from '#lib/utils/autosave.svelte.ts';
	import format_time from '$utilities/format_time';
	import { format } from 'date-fns';
	import { onDestroy } from 'svelte';
	import { get_content_detail, get_tag_options } from '../../admin_content.remote';
	import { update_video_meta } from '../admin_videos.remote';

	// YouTube owns a video's title, description and date (src/server/video/video_sync.ts), so
	// they're shown, not edited. Archiving takes it off the site; the sync never brings it back.

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface VideoMetaSnapshot {
		content_id: string;
		status: Status;
		tag_ids?: string[];
	}

	const content_id = (page.params as Record<string, string>).content_id ?? '';
	const content_item = await get_content_detail(content_id);
	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let status = $state<Status>((content_item?.status ?? 'DRAFT') as Status);
	let selected_tag_ids = $state(content_item?.tags.map((content_tag) => content_tag.tag.id) ?? []);

	const autosave = create_autosave_controller<VideoMetaSnapshot>(async (snapshot) => {
		try {
			await update_video_meta(snapshot);
		} catch (error) {
			console.error('Unable to autosave video metadata', error);
			throw error;
		}
	});

	onDestroy(() => autosave.cleanup());

	function save_now(tag_ids?: string[]): void {
		if (!content_item) return;
		autosave.schedule({
			content_id: content_item.id,
			status,
			...(tag_ids !== undefined ? { tag_ids: [...tag_ids] } : {})
		});
		autosave.save_now().catch((error) => {
			console.error('Unable to flush video autosave', error);
		});
	}

	function handle_status_change(next_status: Status): void {
		status = next_status;
		save_now();
	}

	function handle_tag_change(next_selected_tag_ids: string[]): void {
		selected_tag_ids = [...next_selected_tag_ids];
		save_now(selected_tag_ids);
	}
</script>

<svelte:head>
	<title
		>{content_item
			? `Edit video: ${content_item.title} | Syntax Admin`
			: 'Video not found | Syntax Admin'}</title
	>
</svelte:head>

{#if !content_item}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">Video not found.</p>
	</div>
{:else}
	<div class="admin-page stack">
		<AdminEditorHeader
			title={content_item.title}
			detail="Video · from YouTube"
			public_href={status === 'PUBLISHED'
				? resolve(`videos/${content_item.slug}`)
				: content_item.video?.url}
			{autosave}
		/>

		<div class="admin-editor-layout">
			<section class="admin-editor-main" aria-label="From YouTube">
				{#if content_item.video?.thumbnail}
					<img
						class="admin-editor-thumbnail"
						src={content_item.video.thumbnail}
						alt=""
						width="320"
						height="180"
					/>
				{/if}
				<dl class="admin-source-facts">
					<dt>Page</dt>
					<dd>
						{#if status === 'PUBLISHED'}
							<a href="/videos/{content_item.slug}">/videos/{content_item.slug}</a>
						{:else}
							/videos/{content_item.slug}
						{/if}
					</dd>

					<dt>YouTube</dt>
					<dd>
						{#if content_item.video?.url}
							<a href={content_item.video.url} target="_blank" rel="noopener noreferrer external"
								>{content_item.video.url}</a
							>
						{:else}
							—
						{/if}
					</dd>

					<dt>Published</dt>
					<dd>
						{content_item.published_at
							? format(content_item.published_at, 'MMM d, yyyy HH:mm')
							: '—'}
					</dd>

					<dt>Length</dt>
					<dd>
						{content_item.video?.duration_seconds
							? format_time(content_item.video.duration_seconds)
							: '—'}
					</dd>

					<dt>Views</dt>
					<dd>{content_item.video?.view_count?.toLocaleString() ?? '—'}</dd>
				</dl>
			</section>

			<aside class="admin-metadata-rail" aria-label="Video settings">
				<StatusSelect {status} onchange={handle_status_change} />

				<MultiSelect
					options={tag_options}
					selected_ids={selected_tag_ids}
					label="Tags"
					onchange={handle_tag_change}
				/>
			</aside>
		</div>
	</div>
{/if}
