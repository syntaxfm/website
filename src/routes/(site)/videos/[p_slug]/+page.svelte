<script lang="ts">
	import PlaylistVideo from "$/lib/videos/PlaylistVideo.svelte";

	export let data;
	$: ({ playlist } = data);
</script>

{#if playlist}
	<h1 class="h3">{playlist.title}</h1>
	<div class="playlist-grid grid">
		{#each playlist.videos as { video }}
			<PlaylistVideo {playlist} {video} />
		{/each}
	</div>
{/if}

<style lang="postcss">
	.playlist-grid {
		display: grid;
		grid-gap: 20px;
		@media (--above_med) {
			grid-template-columns: repeat(3, minmax(260px, 1fr));
		}
	}
</style>
