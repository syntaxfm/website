<script>
	import AdminActions from '$lib/AdminActions.svelte';
	import AdminSearch from '$lib/AdminSearch.svelte';
	import { get_all_articles } from './admin_articles.remote';

	let search_text = $state('');

	const articles = await get_all_articles();
</script>

<h1 class="h4">Articles</h1>

<AdminActions>
	<!-- Todo -->
	TBD
</AdminActions>

<AdminSearch bind:text={search_text} />

{#each (await get_all_articles()).filter((a) => a.title
		.toLowerCase()
		.includes(search_text.toLowerCase())) as article}
	<p>{article.title}</p>
	<!-- TODO make this better -->
{/each}
