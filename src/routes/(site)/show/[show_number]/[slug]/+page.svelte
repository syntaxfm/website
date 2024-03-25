<script lang="ts">
	import get_show_path from '$/utilities/slug.js';
	import NewsletterForm from '$lib/NewsletterForm.svelte';

	export let data;
	$: ({ show, prev_show, next_show } = data);
</script>

<div class="main">
	<div class="show-notes">
		{@html show.show_notes}
	</div>
	<nav class="prev-next">
		<div class="prev">
			{#if prev_show}
				<a href={get_show_path(prev_show)} class="prev-link">
					<p class="a">← Prev #{prev_show.number}</p>
					<p class="text-sm">{prev_show.title}</p>
				</a>
			{/if}
		</div>

		<div class="next">
			{#if next_show}
				<a href={get_show_path(next_show)} class="next-link">
					<p class="a">Next #{next_show.number} →</p>
					<p class="text-sm">{next_show.title}</p>
				</a>
			{/if}
		</div>
	</nav>
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
	.prev-next {
		--border-size: 1px;
		border-radius: var(--brad);
		display: grid;
		gap: var(--border-size);
		grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
		margin-bottom: 1rem;
		border: 1px solid var(--fg);
		.prev {
			text-align: left;
			border-right: 1px solid var(--fg);
		}
		.next {
			text-align: right;
		}

		p {
			margin: 0;
			padding: 0.5rem 1rem;
			&:first-child {
				font-weight: 900;
				border-bottom: 1px solid var(--fg);
			}
		}
	}
</style>
