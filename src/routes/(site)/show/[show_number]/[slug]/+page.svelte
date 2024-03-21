<script lang="ts">
	import NewsletterForm from '$lib/NewsletterForm.svelte';

	export let data;
	$: ({ show } = data);
</script>

<div class="main">
	<div class="show-notes">
		{@html show.show_notes}
	</div>
</div>

<div class="sidebar">
	{#if show.videos.length > 0}
		<div class="related-videos">
			<h2 class="h5">Related Videos</h2>

			{#each show.videos as { video }}
				<a href={`/videos/${video.playlists[0].playlist.slug}/${video.slug}`}>
					<img src={video.thumbnail} class="thumbnail" alt={video.title} />
				</a>
			{/each}
		</div>
	{/if}
	<div class="sticky zone card">
		<NewsletterForm />
	</div>
</div>

<style lang="postcss">
	.thumbnail {
		width: 100%;
		overflow: hidden;
		border-radius: var(--brad);
	}

	.related-videos {
		margin-block: 0 2rem;
	}
</style>
