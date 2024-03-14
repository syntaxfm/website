<script>
	import PlaylistVideo from './PlaylistVideo.svelte';

	export let playlist;
</script>

<article class="card">
	<p class="date">
		{playlist.item_count} Videos
	</p>

	<h3><a href={`/videos/${playlist.slug}`}>{playlist.title}</a></h3>

	<div class="grid playlist-grid">
		{#each playlist.playlist_items as playlist_video}
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

			.details {
				/* since we're hiding the description row at these dimensions (which was 100% height), 
				   need a new row to become 100% height -- the show title */
				grid-template-rows: auto 1fr auto auto;
			}
			.description {
				display: none;
				mask-image: none;
			}
		}

		.bottom-row {
			align-self: end;

			/* lay out horizontally */
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1rem;

			.buttons {
				text-align: right;
				align-self: center;
			}
		}
	}

	.h3 {
		view-transition-name: var(--transition-name);
		margin: 0;
		font-weight: 600;
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
		font-weight: 500;
		view-transition-name: var(--transition-name);
		width: max-content;
		@media (prefers-color-scheme: dark) {
			background: var(--bg);
		}
		/* adds contrast when light text overlaps show number */
		text-shadow: 2px 1px 0px var(--bg);
	}

	.play-button {
		background: transparent;
		border-radius: 50%;
		align-self: center;
		border-width: 1px;
		padding: 10px;
		box-shadow: inset 0 0 0 2px color-mix(in lch, var(--fg) 50%, transparent 94%);
		color: var(--fg);
	}

	.show-number {
		position: absolute;
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		--max-font-size: 15rem;
		--ideal-font-size: 45cqw;
		font-size: clamp(1.5rem, var(--ideal-font-size), var(--max-font-size));
		@media (prefers-color-scheme: dark) {
			--ideal-font-size: 22cqw;
		}
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		z-index: -1;

		@media (--below_med) {
			--max-font-size: 8rem;
		}
	}

	@container show-card (width > 600px) {
		.highlight {
			& .h3 {
				font-size: var(--font-size-xl);
			}
		}
		.show-number {
			--max-font-size: 20cqw;
		}
	}
</style>
