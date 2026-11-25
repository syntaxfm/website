<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import { resolve } from '$app/paths';
	import TagRow from '../tags/TagRow.svelte';
	import FeedByline from './FeedByline.svelte';
	import ShowThumbnail from '#lib/shows/ShowThumbnail.svelte';
	import { get_label_browse_url, VIDEO_LABEL } from '#lib/shows/show_label.ts';
	import { get_watch_url_from_url } from '#lib/videos/utils.ts';
	import type { PlayerVideo } from '$state/player_utils';

	// Laid out like FeedItemPodcast, and plays the same way: here, then docked in the player bar
	type Props = {
		youtube_id: string;
		title: string;
		slug: string;
		published_at: string | Date | null;
		tags: Array<{ tag: { name: string; slug: string | null } }>;
	};

	const { youtube_id, title, slug, published_at, tags }: Props = $props();
	const player_video: PlayerVideo = $derived({
		kind: 'VIDEO',
		title,
		slug,
		youtube_url: get_watch_url_from_url(youtube_id)
	});
</script>

<article class="stack">
	<div class="thumb-container">
		<ShowThumbnail
			show={player_video}
			class="br-medium"
			sizes="(min-width: 1200px) 748px, (min-width: 900px) calc(100vw - 452px), calc(100vw - 88px)"
			is_video_slot
		/>
	</div>

	<h3 class="fv-700-i"><a href={resolve(`videos/${slug}`)}>{title}</a></h3>

	<FeedByline label={VIDEO_LABEL} label_href={get_label_browse_url(VIDEO_LABEL)} {published_at} />

	{#if tags.length > 0}
		<TagRow tags={tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug }))} />
	{/if}
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

	/* The same frame as an episode's thumbnail in FeedItemPodcast */
	.thumb-container {
		position: relative;
		border-radius: var(--br-feed-card);
		border: solid var(--feed-frame-width) var(--c-primary);
	}
</style>
