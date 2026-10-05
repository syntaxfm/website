<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import type { Video } from '$server/db/types';

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
