<script lang="ts">
	import { getFeed } from '$lib/feed/feed.remote';
	import FeedItem from './FeedItem.svelte';
	import FeedTitle from './FeedTitle.svelte';
</script>

<section>
	<FeedTitle />
	{#each await getFeed() as post}
		<FeedItem show={post} />
	{/each}
</section>
