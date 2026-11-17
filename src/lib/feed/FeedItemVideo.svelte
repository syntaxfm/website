<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import { resolve } from '$app/paths';
	import TagRow from '../tags/TagRow.svelte';
	import FeedByline from './FeedByline.svelte';
	import { VIDEO_LABEL } from '#lib/shows/show_label.ts';
	import { get_thumbnail_from_id, get_thumbnail_srcset_from_id } from '#lib/videos/utils.ts';

	// Laid out like FeedItemPodcast, linking to the video's own page
	type Props = {
		youtube_id: string;
		title: string;
		slug: string;
		published_at: string | Date | null;
		tags: Array<{ tag: { name: string; slug: string | null } }>;
	};

	const { youtube_id, title, slug, published_at, tags }: Props = $props();
	const href = $derived(resolve(`videos/${slug}`));
</script>

<article class="stack">
	<a class="thumb-container" {href} tabindex="-1" aria-hidden="true">
		<img
			class="br-medium"
			src={get_thumbnail_from_id(youtube_id)}
			srcset={get_thumbnail_srcset_from_id(youtube_id)}
			sizes="(min-width: 1200px) 748px, (min-width: 900px) calc(100vw - 452px), calc(100vw - 88px)"
			width="1280"
			height="720"
			alt=""
			loading="lazy"
			decoding="async"
		/>
	</a>

	<h3 class="fv-700-i"><a {href}>{title}</a></h3>

	<FeedByline label={VIDEO_LABEL} {published_at} />

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
		--frame-width: clamp(6px, 1.6vw, 12px);

		display: block;
		border-radius: calc(var(--br-medium) + var(--frame-width));
		border: solid var(--frame-width) var(--c-primary);
		overflow: hidden;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}
</style>
