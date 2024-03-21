<script lang="ts">
	import type { Playlist, Video } from '@prisma/client';

	export let video: Video;
	export let playlist: Playlist;
</script>

<div>
	<a href={`/videos/${playlist.slug}/${video.slug}`}>
		<img src={video.thumbnail} class="thumbnail" alt={video.title} />
		<h3 class="h6">{video.title}</h3>
	</a>
</div>

<style lang="postcss">
	a {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 10px;
	}

	.h6 {
		margin-top: 0;
	}

	.thumbnail {
		overflow: hidden;
		border-radius: var(--brad);
	}

	img {
		width: 100%;
	}
</style>
