<script lang="ts">
	import type { AllPossibleContent } from '$server/db/types';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';

	type Feed_content = AllPossibleContent & {
		tags: Array<{ tag: { name: string } }>;
	};

	const { content }: { content: Feed_content } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} {content} />
{:else if content.type === 'VIDEO'}
	<FeedItemVideo video={content.video} />
{:else if content.type === 'ARTICLE'}{/if}
