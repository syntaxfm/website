<script lang="ts">
	import type { AllPossibleContent } from '$server/db/types';
	import FeedItemPodcast from './FeedItemPodcast.svelte';
	import FeedItemVideo from './FeedItemVideo.svelte';

	const { content }: { content: AllPossibleContent } = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if content.type === 'PODCAST'}
	<FeedItemPodcast show={content.show} />
{:else if content.type === 'VIDEO'}
	<FeedItemVideo video={content.video} />
{:else if content.type === 'ARTICLE'}{/if}
