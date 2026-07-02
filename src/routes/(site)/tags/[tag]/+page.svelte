<script lang="ts">
	import { page } from '$app/state';
	import Meta from '$lib/meta/Meta.svelte';
	import FeedItem from '$lib/feed/FeedItem.svelte';
	import { get_content_by_tag } from './tags.remote';

	const tag_slug = (page.params as Record<string, string>).tag ?? '';
	const data = await get_content_by_tag(tag_slug);
</script>

<Meta title={`#${data.tag.name}`} />

<main>
	<h1 class="h3">#{data.tag.name}</h1>

	{#if data.items.length > 0}
		<div class="stack">
			{#each data.items as content (content.id)}
				<FeedItem {content} />
			{/each}
		</div>
	{:else}
		<p>No content tagged #{data.tag.name} yet.</p>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
</style>
