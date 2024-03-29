<script lang="ts">
	import type { Playlist, Video } from '@prisma/client';

	export let video: Video;
	export let playlist: Playlist;
</script>

<div>
	<a href={`/videos/${playlist.slug}/${video.slug}`}>
		<div class="thumbnail-wrapper">
			<img src={video.thumbnail} class="thumbnail" alt={video.title} />
			{#if video.duration}
				<span class="duration">{video.duration}</span>
			{/if}
		</div>
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

	
	.thumbnail-wrapper {
		position: relative;
		
		.thumbnail {
			overflow: hidden;
			border-radius: var(--brad);
		}
		.duration {
			position: absolute;
			display: inline-block;
			background: var(--yellow);
			color: var(--black);
			border-radius: 1rem;
			padding: 0.25rem;
			right: 1rem;
			top: 1rem;
			font-weight: 600;
		}
	}

	img {
		width: 100%;
	}
</style>
