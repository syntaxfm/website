<script lang="ts">
	import type { Playlist, PlaylistOnVideo, Video } from '@prisma/client';
	import PlaylistVideo from './PlaylistVideo.svelte';

	export let playlist: Playlist & {
		item_count: number;
		videos: PlaylistOnVideo[] &
			{
				video: Video;
			}[];
	};
</script>

<article class="card">
	<p class="date">
		{playlist.item_count} Videos
	</p>

	<h3><a href={`/videos/${playlist.slug}`}>{playlist.title}</a></h3>

	<div class="grid playlist-grid">
		{#each playlist.videos as playlist_video}
			<PlaylistVideo video={playlist_video.video} {playlist} />
		{/each}
	</div>

	<a class="button see-all" href="/videos/{playlist.slug}">See All Videos</a>
</article>

<style lang="postcss">
	.see-all {
		margin-block-start: 2rem;
		margin-inline-start: auto;
	}

	article {
		--bg: var(--bg-1);
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-color: var(--bg);
		background-image: var(--bgGrit);
		position: relative;
		overflow: hidden;
		align-items: start;
		& a {
			display: flex;
			gap: 10px;
		}

		&:hover {
			background-color: color-mix(in lch, var(--fg), var(--bg) 96%);
		}
		&.card {
			border-radius: var(--brad);
			border: solid var(--border-size) var(--subtle);
		}
		.playlist-grid {
			display: grid;
			grid-gap: 20px;
			grid-template-columns: 1fr;
			@media (--above_med) {
				grid-template-columns: repeat(3, minmax(190px, 1fr));
			}
		}

		@media (--below_med) {
			padding: 10px;
		}
	}

	h3 {
		view-transition-name: var(--transition-name);
		margin: 0;
		font-size: var(--font-size-lg);
		line-height: 1.2;
		text-shadow:
			1px 0 0 var(--bg),
			0 1px 0 var(--bg),
			-1px 0 0 var(--bg),
			0 -1px 0 var(--bg);
	}

	.date {
		font-size: var(--font-size-sm);
		margin: 0;
		view-transition-name: var(--transition-name);
		width: max-content;
		@media (prefers-color-scheme: dark) {
			background: var(--bg);
		}
		/* adds contrast when light text overlaps show number */
		text-shadow: 2px 1px 0px var(--bg);
	}
</style>
