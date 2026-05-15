<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import { createUseQueryParams } from 'svelte-query-params';
	import { sveltekit } from 'svelte-query-params/adapters/sveltekit';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import { create_article, list_articles } from './admin_articles.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const PAGE_SIZE = 25;

	type ArticleStatusFilter = (typeof STATUS_FILTERS)[number];

	type QueryValue = string | string[] | undefined;

	function first(value: QueryValue): string {
		if (Array.isArray(value)) return value[0] ?? '';
		return value ?? '';
	}

	function picklist<T extends string>(allowed: readonly T[], fallback: T) {
		return (value: QueryValue): T => {
			const raw = first(value);
			return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
		};
	}

	function string_default(fallback = '') {
		return (value: QueryValue): string => first(value) || fallback;
	}

	function page_int(value: QueryValue): number {
		const parsed = Number.parseInt(first(value), 10);
		if (!Number.isFinite(parsed) || parsed < 1) return 1;
		return parsed;
	}

	const use_params = createUseQueryParams(
		{
			q: string_default(''),
			status: picklist<ArticleStatusFilter>(STATUS_FILTERS, 'ALL'),
			page: page_int
		},
		{
			adapter: sveltekit({ replace: true }),
			debounce: 250
		}
	);

	const [params, helpers] = use_params(current_page.url);

	const STATUS_FILTER_OPTIONS = STATUS_FILTERS.map((value) => ({
		value: value === 'ALL' ? '' : value,
		label: value === 'ALL' ? 'All' : value
	}));

	let creating = $state(false);
	let create_error = $state('');

	let url_q = $derived(current_page.url.searchParams.get('q') ?? '');
	let url_status = $derived(
		(current_page.url.searchParams.get('status') as ArticleStatusFilter | null) ?? 'ALL'
	);
	let url_page = $derived(page_int(current_page.url.searchParams.get('page') ?? undefined));

	let show_clear_filters = $derived(url_q !== '' || url_status !== 'ALL');

	function get_list_articles_query() {
		return list_articles({
			search_text: url_q,
			status: url_status,
			page: url_page,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_articles_query());

	function on_status_select(next_value: string) {
		const fallback: ArticleStatusFilter = 'ALL';
		const next = (next_value || fallback) as ArticleStatusFilter;
		helpers.update({ status: next, page: 1 });
	}

	function on_page_change(next_page: number) {
		helpers.update({ page: next_page });
	}

	async function create_new_article() {
		create_error = '';
		creating = true;
		try {
			const created = await create_article({ title: 'Untitled Article' });
			await goto(`/admin/content/articles/${created.content_id}`);
		} catch (error) {
			console.error(error);
			create_error = error instanceof Error ? error.message : 'Unable to create article.';
			creating = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Articles</h1>
		<AdminActions>
			<button type="button" onclick={create_new_article} disabled={creating}>
				{creating ? 'Creating...' : 'Create Article'}
			</button>
		</AdminActions>
	</div>

	{#if create_error}
		<p class="fs-2" style="color: var(--c-red)">{create_error}</p>
	{/if}

	{#await list_result_promise}
		<p class="fs-2">Loading articles...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.content_id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			{visible_ids}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch bind:text={params.q} />
					<div
						class="flex"
						style="--flex-gap: var(--pad-small); flex-wrap: wrap; align-items: flex-end"
					>
						<SelectMenu
							popover_id="filter-status"
							button_text={`Status ${params.status !== 'ALL' ? `(${params.status})` : ''}`}
							value={params.status === 'ALL' ? '' : params.status}
							options={STATUS_FILTER_OPTIONS}
							onselect={on_status_select}
						/>
						{#if show_clear_filters}
							<a class="button small" href="/admin/content/articles">× Clear</a>
						{/if}
					</div>
				</div>
			{/snippet}

			{#snippet table_head()}
				<th>Title</th>
				<th>Status</th>
				<th>Author</th>
				<th>Updated</th>
			{/snippet}

			{#snippet table_body()}
				{#each list_items as article_item (article_item.content_id)}
					{@const edit_link = `/admin/content/articles/${article_item.content_id}`}
					<tr>
						<td>
							<div class="stack" style:--stack-gap="var(--pad-xsmall)">
								<p>{article_item.meta.title}</p>
								<a href={edit_link}>Edit</a>
							</div>
						</td>
						<td>{article_item.meta.status}</td>
						<td>
							{article_item.author?.name || article_item.author?.username || '-'}
						</td>
						<td>
							{#if article_item.meta.updated_at}
								{format(article_item.meta.updated_at, 'MMM d, yyyy HH:mm')}
							{:else}
								-
							{/if}
						</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="4">No articles found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load articles. Please try again.</p>
	{/await}
</div>
