<script lang="ts">
	import { format } from 'date-fns';
	import { page as current_page } from '$app/state';
	import { createUseQueryParams } from 'svelte-query-params';
	import { sveltekit } from 'svelte-query-params/adapters/sveltekit';
	import AdminActions from '../../AdminActions.svelte';
	import AdminSearch from '../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import { list_videos } from './admin_videos.remote';

	const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
	const PAGE_SIZE = 25;

	type VideoStatusFilter = (typeof STATUS_FILTERS)[number];

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
			status: picklist<VideoStatusFilter>(STATUS_FILTERS, 'ALL'),
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

	let selected_video_ids = $state<string[]>([]);

	let url_q = $derived(current_page.url.searchParams.get('q') ?? '');
	let url_status = $derived(
		(current_page.url.searchParams.get('status') as VideoStatusFilter | null) ?? 'ALL'
	);
	let url_page = $derived(page_int(current_page.url.searchParams.get('page') ?? undefined));

	let show_clear_filters = $derived(url_q !== '' || url_status !== 'ALL');

	function get_list_videos_query() {
		return list_videos({
			search_text: url_q,
			status: url_status,
			page: url_page,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_videos_query());

	function on_page_change(next_page: number) {
		helpers.update({ page: next_page });
	}

	function on_status_select(next_value: string) {
		const fallback: VideoStatusFilter = 'ALL';
		const next = (next_value || fallback) as VideoStatusFilter;
		helpers.update({ status: next, page: 1 });
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Videos</h1>
		<AdminActions>
			<a class="button small" href="/admin/content/videos/import">Import New Videos</a>
		</AdminActions>
	</div>

	{#await list_result_promise}
		<p class="fs-2">Loading videos...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			bind:selected_ids={selected_video_ids}
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
							button_icon={'filter' as any}
							value={params.status === 'ALL' ? '' : params.status}
							options={STATUS_FILTER_OPTIONS}
							onselect={on_status_select}
						/>
						{#if show_clear_filters}
							<a class="button small" href="/admin/content/videos">× Clear</a>
						{/if}
					</div>
				</div>
			{/snippet}

			{#snippet table_head()}
				<th>Title</th>
				<th>Status</th>
				<th>Published</th>
				<th>YouTube</th>
			{/snippet}

			{#snippet table_body()}
				{#each list_items as video_row (video_row.id)}
					{@const has_content = video_row.meta !== null && video_row.meta !== undefined}
					{@const display_title = video_row.meta?.title ?? video_row.title}
					<tr>
						<td>
							<div class="stack" style:--stack-gap="var(--pad-xsmall)">
								<p>{display_title}</p>
								{#if has_content}
									<a href={`/admin/content/videos/${video_row.meta?.id}`}>Edit</a>
								{/if}
							</div>
						</td>
						<td>{video_row.meta?.status ?? '-'}</td>
						<td>
							{#if video_row.published_at}
								{format(video_row.published_at, 'MMM d, yyyy HH:mm')}
							{:else}
								-
							{/if}
						</td>
						<td>
							<a href={video_row.url} target="_blank" rel="noopener noreferrer">↗</a>
						</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="4">No matching videos found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load videos. Please try again.</p>
	{/await}
</div>
