<script lang="ts">
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
	import { to_content_edit_path, to_content_public_href } from '#lib/admin/content_links.ts';
	import { humanize_enum } from '#lib/utils/format_enum.ts';
	import { get_tag_detail } from '../admin_tags.remote';

	const tag_id = (current_page.params as Record<string, string>).id ?? '';
	const detail = await get_tag_detail(tag_id);
</script>

<svelte:head>
	<title>Tag: {detail.tag.name} | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<AdminEditorHeader
		back_href={resolve('admin/tags')}
		back_label="Tags"
		title={detail.tag.name}
		detail={`/${detail.tag.slug} · ${detail.total_content_count.toLocaleString()} tagged`}
		public_href={resolve(`tags/${detail.tag.slug}`)}
	/>

	<AdminList total={detail.items.length} visible_ids={detail.items.map((item) => item.id)}>
		{#snippet table_head()}
			<th>Title</th>
			<th>Type</th>
			<th>Status</th>
			<th>Updated</th>
		{/snippet}

		{#snippet table_body()}
			{#each detail.items as content_row (content_row.id)}
				{@const edit_path = to_content_edit_path(content_row)}
				<tr>
					<AdminTitleCell
						title={content_row.title}
						edit_href={edit_path ? resolve(edit_path) : null}
						public_href={to_content_public_href(content_row)}
					/>
					<td class="admin-cell-muted">{humanize_enum(content_row.type)}</td>
					<td><StatusBadge status={content_row.status} /></td>
					<AdminDateCell value={content_row.updated_at} show_time />
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
		<p class="admin-feedback">
			Showing first {detail.limit} of {detail.total_content_count}.

			<a href={resolve(`admin/content?tag_id=${detail.tag.id}`)}>Open in content list</a>

			for full results.
		</p>
	{/if}
</div>
