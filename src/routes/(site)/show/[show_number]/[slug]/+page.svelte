<script lang="ts">
	import PrevNext from '$lib/shows/PrevNext.svelte';
	import SwaggyNewsletterForm from '$lib/newsletter/SwaggyNewsletterForm.svelte';
	import ShowNotes from '$lib/shows/ShowNotes.svelte';
	let { data } = $props();
	let { show, prev_show, next_show } = $derived(data);
</script>

<div class="main">
	<ShowNotes show_notes={show.show_notes} />
	<PrevNext {prev_show} {next_show} />
</div>

<div class="sidebar">
	{#if show?.videos?.length > 0}
		<div class="related-videos">
			<h2 class="h5">Related Videos</h2>

			{#each show.videos as { video }}
				<a href={`/videos/${video.playlists[0].playlist.slug}/${video.slug}`}>
					<img src={video.thumbnail} class="thumbnail" alt={video.title} />
				</a>
			{/each}
		</div>
	{/if}
	<div class="sticky">
		<SwaggyNewsletterForm />
	</div>
</div>

<style lang="postcss">
	.thumbnail {
		width: 100%;
		overflow: hidden;
		border-radius: var(--br-medium);
	}

	.related-videos {
		margin-block: 0 2rem;
	}
</style>
