<script lang="ts">
	import TagRow from '../tags/TagRow.svelte';
	import type { ComponentProps } from 'svelte';
	import { get_faces_from_show, get_people_line, type FaceShow } from '#lib/hosts/hosts_utils.ts';
	import ShowThumbnail from '#lib/shows/ShowThumbnail.svelte';
	import { resolve } from '$app/paths';
	import FeedByline from './FeedByline.svelte';
	import { get_show_label, type LabeledShow } from '#lib/shows/show_label.ts';

	type Feed_show = ComponentProps<typeof ShowThumbnail>['show'] & FaceShow & LabeledShow;
	type Feed_content = {
		published_at: string | Date | null;
		tags: Array<{ tag: { name: string; slug: string | null } }>;
	};

	const { show, content }: { show: Feed_show; content: Feed_content } = $props();

	const faces = $derived(get_faces_from_show(show));
</script>

<article class="stack">
	<div class="thumb-container">
		<ShowThumbnail
			{show}
			class="br-medium"
			sizes="(min-width: 1200px) 748px, (min-width: 900px) calc(100vw - 452px), calc(100vw - 88px)"
			is_video_slot
		/>
	</div>

	<h3 class="fv-700-i"><a href={resolve(`show/${show.number}/${show.slug}`)}>{show.title}</a></h3>

	<FeedByline
		label={get_show_label(show)}
		published_at={content.published_at}
		{faces}
		people={get_people_line(faces)}
	/>

	{#if content.tags.length > 0}
		<TagRow tags={content.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug }))} />
	{/if}
</article>

<style>
	article {
		--stack-gap: 14px;

		/* With the feed's own gap, cards sit further from each other than a card's parts do */
		padding-bottom: 2rem;
	}

	h3 {
		margin: 0;
		font-size: var(--fs-7);
	}

	.thumb-container {
		/* 12px on a wide screen, down to 6px on a phone */
		--frame-width: clamp(6px, 1.6vw, 12px);

		position: relative;

		/* Follows the picture's own corner, so the frame keeps an even width around it */
		border-radius: calc(var(--br-medium) + var(--frame-width));
		border: solid var(--frame-width) var(--c-primary);
	}
</style>
