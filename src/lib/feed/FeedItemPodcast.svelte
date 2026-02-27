<script lang="ts">
	import no_thumb from '../shows/no_thumb.png';
	import TagRow from '../tags/TagRow.svelte';
	import type { ShowWithHostsAndGuests } from '$server/db/types';
	import FeedHosts from '$lib/hosts/FeedHosts.svelte';
	import { get_id_from_url, get_thumbnail_from_id } from '$lib/videos/utils';

	type Feed_show = ShowWithHostsAndGuests & { thumbnail?: string | null };
	type Feed_content = {
		tags: Array<{ tag: { name: string } }>;
	};

	const { show, content }: { show: Feed_show; content: Feed_content } = $props();
	let youtube_video_id = $derived(show?.youtube_url ? get_id_from_url(show.youtube_url) : '');
	let thumbnail_src = $derived(
		(youtube_video_id ? get_thumbnail_from_id(youtube_video_id) : '') || show?.thumbnail || no_thumb
	);
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
		<img src={thumbnail_src} alt={show.title} />
	</div>
	<h4 class="fv-700-i">
		<a href={`/show/${show.number}/${show.slug}`}>
			{show.title}
		</a>
	</h4>
	<TagRow tags={content.tags.map((tag) => tag.tag.name)} />
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
		/*margin-top: -6.5rem;*/
	}

	img {
		border-radius: 20px;
		border: solid 12px var(--c-primary);
		width: 100%;
	}
</style>
