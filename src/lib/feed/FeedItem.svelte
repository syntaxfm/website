<script lang="ts">
	import type { get_feed_content } from './feed.remote';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';

	// The Home feed is edge cached as JSON (dates are strings); the Guest and Tag feeds aren't (Dates)
	type Cached_content = Awaited<ReturnType<typeof get_feed_content>>[number];
	type Feed_content = Omit<Cached_content, 'published_at' | 'show'> & {
		published_at: string | Date | null;
		show: Omit<Cached_content['show'], 'date'> & { date: string | Date };
	};

	const { content }: { content: Feed_content } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} {content} />
{:else if content.type === 'VIDEO'}
	<FeedItemVideo video={content.video} published_at={content.published_at} />
{:else if content.type === 'ARTICLE'}{/if}
