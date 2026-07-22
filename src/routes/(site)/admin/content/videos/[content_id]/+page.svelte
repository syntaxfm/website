<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AdminConfirmDialog from '$lib/admin/AdminConfirmDialog.svelte';
	import AdminSaveStatus from '$lib/admin/AdminSaveStatus.svelte';
	import DateTimePicker from '$lib/admin/DateTimePicker.svelte';
	import MultiSelect from '$lib/admin/MultiSelect.svelte';
	import StatusSelect from '$lib/admin/StatusSelect.svelte';
	import { create_autosave_controller } from '$lib/utils/autosave.svelte';
	import { onDestroy } from 'svelte';
	import { get_content_detail, get_tag_options } from '../../admin_content.remote';
	import { delete_video, update_video_meta } from '../admin_videos.remote';

	type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

	interface VideoMetaSnapshot {
		content_id: string;
		status: Status;
		published_at_iso: string | null;
		tag_ids?: string[];
	}

	interface VideoMetaSnapshotOptions {
		tag_ids?: string[];
	}

	const content_id = (page.params as Record<string, string>).content_id ?? '';
	const content_item = await get_content_detail(content_id);
	const initial_status = (content_item?.status ?? 'DRAFT') as Status;
	const initial_published_at = content_item?.published_at
		? new Date(content_item.published_at)
		: null;
	const initial_selected_tag_ids =
		content_item?.tags.map((content_tag) => content_tag.tag.id) ?? [];
	const tag_options = (await get_tag_options()).map((tag_item) => ({
		id: tag_item.id,
		name: tag_item.name
	}));

	let status = $state<Status>(initial_status);
	let published_at = $state<Date | null>(initial_published_at);
	let selected_tag_ids = $state(initial_selected_tag_ids);

	const autosave = create_autosave_controller<VideoMetaSnapshot>(async (snapshot) => {
		try {
			await update_video_meta(snapshot);
		} catch (error) {
			console.error('Unable to autosave video metadata', error);
			throw error;
		}
	});

	onDestroy(() => autosave.cleanup());

	function create_video_meta_snapshot({
		tag_ids
	}: VideoMetaSnapshotOptions = {}): VideoMetaSnapshot | null {
		if (!content_item) {
			return null;
		}

		return {
			content_id: content_item.id,
			status,
			published_at_iso: published_at ? published_at.toISOString() : null,
			...(tag_ids !== undefined ? { tag_ids: [...tag_ids] } : {})
		};
	}

	function save_snapshot_immediately(options?: VideoMetaSnapshotOptions): void {
		const snapshot = create_video_meta_snapshot(options);
		if (!snapshot) {
			return;
		}

		autosave.schedule(snapshot);
		autosave.save_now().catch((error) => {
			console.error('Unable to flush video autosave', error);
		});
	}

	function handle_status_change(next_status: Status): void {
		status = next_status;
		if (status === 'PUBLISHED' && !published_at) {
			published_at = new Date();
		}
		save_snapshot_immediately();
	}

	function handle_published_at_change(next_published_at: Date | null): void {
		published_at = next_published_at;
		save_snapshot_immediately();
	}

	function handle_tag_change(next_selected_tag_ids: string[]): void {
		selected_tag_ids = [...next_selected_tag_ids];
		save_snapshot_immediately({ tag_ids: selected_tag_ids });
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		await autosave.save_now();
	}

	async function handle_delete_video(): Promise<void> {
		if (!content_item) {
			throw new Error('Video not found');
		}

		await autosave.save_now();

		try {
			await delete_video({ content_id: content_item.id, confirm_text: 'DELETE' });
			await goto(resolve('/admin/content/videos'));
		} catch (error) {
			console.error('Unable to delete video', error);
			throw error;
		}
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
		<AdminSaveStatus
			state={autosave.state}
			error_message={autosave.error_message}
			onretry={() => autosave.retry()}
		/>

		<form class="admin-editor stack" onsubmit={handle_submit}>
			<div class="admin-editor-layout">
				<section class="admin-editor-main" aria-labelledby="video-facts-heading">
					<h2 id="video-facts-heading" class="h5">Video</h2>
					<p class="admin-source-note">Synced from YouTube</p>
					<dl class="admin-source-facts">
						<dt>Title</dt>
						<dd>{content_item.title}</dd>

						<dt>Slug</dt>
						<dd>{content_item.slug}</dd>

						<dt>YouTube URL</dt>
						<dd>
							{#if content_item.video?.url}
								<a href={content_item.video.url} target="_blank" rel="noopener noreferrer external"
									>{content_item.video.url}</a
								>
							{:else}
								—
							{/if}
						</dd>
					</dl>
				</section>

				<aside class="admin-metadata-rail" aria-labelledby="content-metadata-heading">
					<h2 id="content-metadata-heading" class="h5">Content</h2>
					<StatusSelect {status} onchange={handle_status_change} />
					<DateTimePicker value={published_at} onchange={handle_published_at_change} />
					<MultiSelect
						options={tag_options}
						selected_ids={selected_tag_ids}
						label="Tags"
						onchange={handle_tag_change}
					/>
				</aside>
			</div>
		</form>

		<section class="admin-danger stack" aria-labelledby="delete-video-heading">
			<h2 id="delete-video-heading" class="h5">Delete video</h2>
			<p>Permanently remove this video.</p>
			<AdminConfirmDialog
				title="Delete video?"
				description="This permanently deletes the video and cannot be undone."
				action_label="Delete video"
				onconfirm={handle_delete_video}
			/>
		</section>
	</div>
{/if}
