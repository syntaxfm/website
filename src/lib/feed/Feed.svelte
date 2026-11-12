<script lang="ts">
	import { get_feed_content } from '#lib/feed/feed.remote.ts';
	import FeedItem from './FeedItem.svelte';
</script>

<section>
	<h2 class="h3">Today's Feed</h2>
	<div class="stack">
		{#each await get_feed_content() as content (content.id)}
			<FeedItem {content} />
		{/each}
	</div>
</section>

<style>
	.stack {
		margin-top: 1.5rem;
	}
</style>
