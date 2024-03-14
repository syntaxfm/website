<script lang="ts">
	export let data;
	$: ({ playlist } = data);
</script>

<h1 class="h3">{playlist.title}</h1>

<div class="playlist-grid grid">
	{#each playlist.playlist_items as { video }}
		<a href={`/videos/${playlist.slug}/${video.slug}`}>
			<img src={video.thumbnail} class="thumbnail" alt={video.title} />
			<h3 class="h6">{video.title}</h3>
		</a>
	{/each}
</div>

<style lang="postcss">
	img {
		width: 100%;
	}
	.h6 {
		margin-bottom: 0;
	}
	.playlist-grid {
		display: grid;
		grid-gap: 20px;
		@media (--above_med) {
			grid-template-columns: repeat(3, minmax(260px, 1fr));
		}
	}
</style>
