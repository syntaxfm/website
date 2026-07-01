<script lang="ts">
	import { format } from 'date-fns';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { get_tag_detail } from '../admin_tags.remote';

	const tag_id = (current_page.params as Record<string, string>).id ?? '';
	const detail = await get_tag_detail(tag_id);

	type TagDetail = Awaited<ReturnType<typeof get_tag_detail>>;
	type TagDetailItem = TagDetail['items'][number];

	function to_edit_link(content_row: TagDetailItem): Pathname | null {
		if (content_row.type === 'ARTICLE') {
			return `/admin/content/articles/${content_row.id}`;
		}

		if (content_row.type === 'PODCAST' && content_row.show) {
			return `/admin/content/podcast/${content_row.show.number}`;
		}

		if (content_row.type === 'VIDEO') {
			return `/admin/content/videos/${content_row.id}`;
		}

		return null;
	}

	function to_public_link(content_row: TagDetailItem) {
		if (content_row.show) {
			return `/show/${content_row.show.number}/${content_row.show.slug}`;
		}

		if (content_row.video) {
			return content_row.video.url;
		}

		return null;
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<header class="stack" style:--stack-gap="var(--pad-xsmall)">
		<h1 class="h3">{detail.tag.name}</h1>
		<p class="fs-2">/{detail.tag.slug} · {detail.total_content_count} content item(s)</p>
		<p>
			<a href={resolve(`/admin/content?tag_id=${detail.tag.id}`)}>View in content list</a>
		</p>
	</header>

	<AdminList
		total={detail.items.length}
		page={1}
		page_size={detail.items.length || 1}
		total_pages={1}
		on_page_change={() => {}}
		visible_ids={detail.items.map((item) => item.id)}
	>
		{#snippet table_head(_params)}
			<th>Title</th>
			<th>Type</th>
			<th>Status</th>
			<th>Updated</th>
		{/snippet}

		{#snippet table_body(_params)}
			{#each detail.items as content_row (content_row.id)}
				{@const edit_link = to_edit_link(content_row)}
				{@const public_link = to_public_link(content_row)}
				<tr>
					<td>
						<div class="stack" style:--stack-gap="var(--pad-xsmall)">
							{#if edit_link}
								<a href={resolve(edit_link)}>{content_row.title}</a>
							{:else}
								<p>{content_row.title}</p>
							{/if}
							{#if public_link}
								<a
									class="fs-2"
									href={public_link}
									target="_blank"
									rel="noopener noreferrer external"
								>
									View public
								</a>
							{/if}
						</div>
					</td>
					<td>{content_row.type}</td>
					<td>{content_row.status}</td>
					<td>{format(content_row.updated_at, 'MMM d, yyyy HH:mm')}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="4">No content tagged yet.</td>
			</tr>
		{/snippet}
	</AdminList>

	{#if detail.total_content_count > detail.limit}
		<p class="fs-2">
			Showing first {detail.limit} of {detail.total_content_count}.
			<a href={resolve(`/admin/content?tag_id=${detail.tag.id}`)}>Open in content list</a> for full results.
		</p>
	{/if}

	<p><a href={resolve('/admin/tags')}>Back to tags</a></p>
</div>
