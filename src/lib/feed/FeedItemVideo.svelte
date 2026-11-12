<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import type { Video } from '$server/db/types';
	import FeedByline from './FeedByline.svelte';
	import { VIDEO_LABEL } from './feed_label';

	type Props = {
		video: Pick<Video, 'title'>;
		published_at: string | Date | null;
	};

	const { video, published_at }: Props = $props();
</script>

<article class="stack">
	<h3 class="fv-700-i">{video.title}</h3>
	<FeedByline label={VIDEO_LABEL} {published_at} />
</article>

<style>
	article {
		--stack-gap: 14px;

		padding-bottom: 2rem;
	}

	h3 {
		margin: 0;
		font-size: var(--fs-7);
	}
</style>
