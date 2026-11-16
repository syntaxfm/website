<script lang="ts">
	import { page } from '$app/state';
	import FeedItem from '#lib/feed/FeedItem.svelte';
	import FeedSidebar from '#lib/feed/FeedSidebar.svelte';
	import KeyMoments from '#lib/sidebar/KeyMoments.svelte';
	import { get_content_by_tag } from './tags.remote';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// Derived: going from one tag to another (the sidebar's Trending Topics) keeps this page mounted
	let tag_slug = $derived((page.params as Record<string, string>).tag ?? '');
	let tag_data = $derived(await get_content_by_tag(tag_slug));
</script>

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{data.schema_json}</svelte:element>
</svelte:head>

<div class="layout-sidebar">
	<section>
		<h1 class="h3">#{tag_data.tag.name}</h1>

		{#if tag_data.items.length > 0}
			<div class="stack">
				{#each tag_data.items as content (content.id)}
					<FeedItem {content} />
				{/each}
			</div>
		{:else}
			<p>No content tagged #{tag_data.tag.name} yet.</p>
		{/if}
	</section>
	<FeedSidebar>
		{#if tag_data.key_moments.length > 0}
			<KeyMoments moments={tag_data.key_moments} />
		{/if}
	</FeedSidebar>
</div>

<style>
	/* Matches the Home feed's spacing under its title */
	.stack,
	p {
		margin-top: 1.5rem;
	}
</style>
