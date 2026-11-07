<script lang="ts">
	import type { get_feed_content } from './feed.remote';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';

	// The Home feed is edge cached as JSON (dates are strings); the Guest and Tag feeds aren't (Dates)
	type Feed_content = Omit<Awaited<ReturnType<typeof get_feed_content>>[number], 'published_at'> & {
		published_at: string | Date | null;
	};

	const { content }: { content: Feed_content } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} {content} />
{:else if content.type === 'VIDEO'}
	<FeedItemVideo video={content.video} />
{:else if content.type === 'ARTICLE'}{/if}
