<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminDateRange from '#lib/admin/AdminDateRange.svelte';
	import AdminFilterMenu from '#lib/admin/AdminFilterMenu.svelte';
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminSearch from '#lib/admin/AdminSearch.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
	import {
		build_url,
		has_any_filter,
		read_int,
		read_picklist,
		read_string,
		to_filter_options
	} from '#lib/admin/admin_filters.ts';
	import { create_article, list_articles } from './admin_articles.remote';

	const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const ORDER_VALUES = ['desc', 'asc'] as const;
	const FILTER_KEYS = ['q', 'status', 'date_from', 'date_to', 'order'] as const;
	const PAGE_SIZE = 25;

	const STATUS_FILTER_OPTIONS = to_filter_options(STATUSES, { include_all: true });
	const ORDER_OPTIONS = [
		{ value: 'desc', label: 'Newest first' },
		{ value: 'asc', label: 'Oldest first' }
	];

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let status_filter = $derived(
		read_picklist(current_page.url.searchParams, 'status', ['', ...STATUSES] as const, '')
	);
	let date_from = $derived(read_string(current_page.url.searchParams, 'date_from'));
	let date_to = $derived(read_string(current_page.url.searchParams, 'date_to'));
	let order = $derived(read_picklist(current_page.url.searchParams, 'order', ORDER_VALUES, 'desc'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let creating = $state(false);
	let create_error = $state('');

	let list_result = $derived(
		await list_articles({
			search_text,
			status: status_filter || 'ALL',
			date_from_iso: date_from || undefined,
			date_to_iso: date_to || undefined,
			order,
			page: page_number,
			page_size: PAGE_SIZE
		})
	);

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replace: true,
			reset: false
		});
	}

	async function create_new_article() {
		create_error = '';
		creating = true;
		try {
			const created = await create_article({ title: 'Untitled Article' });
			await goto(resolve(`admin/content/articles/${created.content_id}`));
		} catch (error) {
			console.error(error);
			create_error = error instanceof Error ? error.message : 'Unable to create article.';
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Articles | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-actions">
		<button type="button" data-intent="primary" onclick={create_new_article} disabled={creating}>
			{creating ? 'Creating...' : 'Create Article'}
		</button>
	</div>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		visible_ids={list_result.items.map((item) => item.content_id)}
		error={create_error}
		clear_href={show_clear_filters ? resolve('admin/content/articles') : null}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => update_url({ q: value || null, page: null })}
			/>
			<AdminDateRange
				from={date_from}
				to={date_to}
				onchange={(key, value) => update_url({ [key]: value || null, page: null })}
			/>
			<AdminFilterMenu
				label="Status"
				value={status_filter}
				options={STATUS_FILTER_OPTIONS}
				onselect={(value) => update_url({ status: value || null, page: null })}
			/>
			<AdminFilterMenu
				label="Sort"
				value={order}
				options={ORDER_OPTIONS}
				onselect={(value) => update_url({ order: value === 'desc' ? null : value, page: null })}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Title</th>
			<th>Status</th>
			<th>Author</th>
			<th>Updated</th>
		{/snippet}

		{#snippet table_body()}
			{#each list_result.items as article_item (article_item.content_id)}
				<tr>
					<AdminTitleCell
						title={article_item.meta.title}
						edit_href={resolve(`admin/content/articles/${article_item.content_id}`)}
					/>
					<td><StatusBadge status={article_item.meta.status} /></td>
					<td class="admin-cell-muted">
						{article_item.author?.name || article_item.author?.username || '-'}
					</td>
					<AdminDateCell value={article_item.meta.updated_at} show_time />
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="4">No articles found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
