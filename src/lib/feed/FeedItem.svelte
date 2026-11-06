<script lang="ts">
	import type { get_feed_content } from './feed.remote';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';

	type Feed_content = Awaited<ReturnType<typeof get_feed_content>>[number];

	const { content }: { content: Feed_content } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} {content} />
{:else if content.type === 'VIDEO'}
	<FeedItemVideo video={content.video} />
{:else if content.type === 'ARTICLE'}{/if}
