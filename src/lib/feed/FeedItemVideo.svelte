<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import no_thumb from '../shows/no_thumb.png';
	import Dot from '$lib/utilities/Dot.svelte';
	import TagRow from '../tags/TagRow.svelte';
	import type { Guest, Host, Show, Video } from '$server/db/types';
	import HostsAndGuests from '$lib/HostsAndGuests.svelte';

	type Props = {
		video: Video;
	};

	const { video }: Props = $props();
</script>

<article>
	<h4>{video.title}</h4>
	<!-- <div>
		<h3 class="h4">Syntax Podcast</h3>
		<p>4 Hours Ago</p>
	</div>
	<div><HostsAndGuests hosts={show.hosts} guests={show.guests} /></div>
	<div>
		<span class="number fv-700-i">#{show.number}</span>
		<img src={show?.thumbnail || no_thumb} alt={show.title} />
	</div>

	<p>{show?.aiShowNote?.description}</p>
	<TagRow tags={show?.aiShowNote?.topics.map((topic) => topic.name)} /> -->
</article>

<style>
	img {
		border-radius: 20px;
		border: solid 12px var(--c-primary);
		width: 100%;
	}

	.number {
		font-size: 160px;
		color: var(--c-primary);
		margin: 0;
		line-height: 0;
		display: block;
		text-align: right;
	}
</style>
