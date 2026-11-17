<script lang="ts">
	import type { get_feed_content } from './feed.remote';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';
	import FeedItemNewsletter from './FeedItemNewsletter.svelte';

	// The Home feed is edge cached as JSON (dates are strings); the Guest and Tag feeds aren't (Dates)
	type Cached_content = Awaited<ReturnType<typeof get_feed_content>>[number];
	// The Guest feed only ever holds episodes, so it doesn't load newsletter_issue
	type Feed_content = Omit<Cached_content, 'published_at' | 'show' | 'newsletter_issue'> & {
		published_at: string | Date | null;
		show: Omit<Cached_content['show'], 'date'> & { date: string | Date };
		newsletter_issue?: Cached_content['newsletter_issue'] | null;
	};

	const { content }: { content: Feed_content } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} {content} />
{:else if content.type === 'VIDEO' && content.video}
	<FeedItemVideo
		youtube_id={content.video.id}
		title={content.title}
		slug={content.slug}
		published_at={content.published_at}
		tags={content.tags}
	/>
{:else if content.type === 'NEWSLETTER' && content.newsletter_issue}
	<FeedItemNewsletter
		title={content.title}
		issue={content.newsletter_issue}
		published_at={content.published_at}
	/>
{:else if content.type === 'ARTICLE'}{/if}
