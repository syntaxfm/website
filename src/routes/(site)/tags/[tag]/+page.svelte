<script lang="ts">
	import { page } from '$app/state';
	import Meta from '#lib/meta/Meta.svelte';
	import FeedItem from '#lib/feed/FeedItem.svelte';
	import FeedSidebar from '#lib/feed/FeedSidebar.svelte';
	import { get_content_by_tag } from './tags.remote';

	// Derived: going from one tag to another (the sidebar's Trending Topics) keeps this page mounted
	let tag_slug = $derived((page.params as Record<string, string>).tag ?? '');
	let data = $derived(await get_content_by_tag(tag_slug));
</script>

<Meta title={`#${data.tag.name}`} />

<div class="layout-sidebar">
	<section>
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
	</section>
	<FeedSidebar />
</div>

<style>
	/* Matches the Home feed's spacing under its title */
	.stack,
	p {
		margin-top: 1.5rem;
	}
</style>
