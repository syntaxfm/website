<script lang="ts">
	import { format } from 'date-fns';
	import AdminActions from '../AdminActions.svelte';
	import AdminSearch from '../AdminSearch.svelte';
	import { goto } from '$app/navigation';
	import { create_article, get_all_articles } from './admin_articles.remote';

	let search_text = $state('');
	let creating = $state(false);
	let create_error = $state('');

	const articles = await get_all_articles();

	let filtered_articles = $derived.by(() => {
		const query = search_text.toLowerCase();
		if (!query) return articles;

		return articles.filter((article_item) => {
			const title = article_item.meta.title.toLowerCase();
			const slug = article_item.meta.slug?.toLowerCase() ?? '';
			const author_name = article_item.author?.name?.toLowerCase() ?? '';
			const author_username = article_item.author?.username?.toLowerCase() ?? '';
			return (
				title.includes(query) ||
				slug.includes(query) ||
				author_name.includes(query) ||
				author_username.includes(query)
			);
		});
	});

	async function create_new_article() {
		create_error = '';
		creating = true;
		try {
			const created = await create_article({ title: 'Untitled Article' });
			await goto(`/admin/content/${created.content_id}/article`);
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
			<button type="button" onclick={() => void create_new_article()} disabled={creating}>
				{creating ? 'Creating...' : 'Create Article'}
			</button>
		</AdminActions>
	</div>

	{#if create_error}
		<p class="fs-2" style="color: var(--c-red)">{create_error}</p>
	{/if}

	<AdminSearch bind:text={search_text} />

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Title</th>
					<th>Status</th>
					<th>Author</th>
					<th>Published</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered_articles.length === 0}
					<tr>
						<td colspan="5">No articles found.</td>
					</tr>
				{:else}
					{#each filtered_articles as article_item (article_item.id)}
						<tr>
							<td>
								<a href={`/admin/content/${article_item.content_id}/article`}>
									{article_item.meta.title}
								</a>
							</td>
							<td>{article_item.meta.status}</td>
							<td>
								{article_item.author?.name || article_item.author?.username || '-'}
							</td>
							<td>
								{#if article_item.meta.published_at}
									{format(article_item.meta.published_at, 'MMM d, yyyy')}
								{:else}
									-
								{/if}
							</td>
							<td>
								<a href={`/admin/content/${article_item.content_id}/article`}>Edit</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
