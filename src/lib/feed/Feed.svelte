<script lang="ts">
	import { get_feed_content } from '$lib/feed/feed.remote';
	import FeedItem from './FeedItem.svelte';
	import FeedTitle from './FeedTitle.svelte';
</script>

<section>
	<FeedTitle />
	<div class="stack">
		{#each await get_feed_content() as content}
			<FeedItem {content} />
		{/each}
	</div>
</section>
