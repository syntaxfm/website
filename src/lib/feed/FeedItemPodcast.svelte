<script lang="ts">
	import TagRow from '../tags/TagRow.svelte';
	import type { ShowWithHostsAndGuests } from '$server/db/types';
	import FeedHosts from '#lib/hosts/FeedHosts.svelte';
	import ShowThumbnail from '#lib/shows/ShowThumbnail.svelte';
	import { resolve } from '$app/paths';

	type Feed_show = ShowWithHostsAndGuests & { thumbnail?: string | null };
	type Feed_content = {
		tags: Array<{ tag: { name: string; slug: string | null } }>;
	};

	const { show, content }: { show: Feed_show; content: Feed_content } = $props();
</script>

<article class="stack">
	<header class="flex">
		<div class="show-logo"></div>
		<div>
			<h3 class="h4 fv-700-i">Syntax Podcast</h3>
			<p>4 Hours Ago</p>
		</div>
	</header>
	<FeedHosts {show} />
	<div class="thumb-container">
		<!-- <span class="number fv-700-i">#{show.number}</span> -->
		<ShowThumbnail
			{show}
			class="br-medium"
			sizes="(min-width: 1200px) 748px, (min-width: 900px) calc(100vw - 452px), calc(100vw - 88px)"
			is_video_slot
		/>
	</div>

	<h4 class="fv-700-i"><a href={resolve(`show/${show.number}/${show.slug}`)}>{show.title}</a></h4>

	<TagRow tags={content.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug }))} />
</article>

<style>
	header {
		align-items: center;
		gap: 20px;
	}

	.show-logo {
		aspect-ratio: 1/1;
		width: 56px;
		height: 56px;
		background: var(--c-primary);
		border-radius: var(--br-medium);
		border: var(--b-medium);
	}

	h4,
	.h4 {
		font-size: var(--fs-7);
	}

	.thumb-container {
		position: relative;
		border-radius: 20px;
		border: solid 12px var(--c-primary);

		/* margin-top: -6.5rem; */
	}
</style>
