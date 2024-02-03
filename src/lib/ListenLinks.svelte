<script lang="ts">
	import type { LatestShow } from '$server/ai/queries';
	import Icon from './Icon.svelte';
	export let show: LatestShow;
</script>

<a
	class="icon"
	target="_blank"
	title="Watch or Listen on Spotify"
	aria-label="Spotify"
	href="https://open.spotify.com/search/syntax.fm {encodeURI(show.title)}/episodes"
>
	<Icon name="spotify" />
</a>
{#if show.youtube_url}
	<a
		class="icon"
		target="_blank"
		title="Watch on Youtube"
		aria-label="Youtube"
		style:--fg="#F61C0D"
		href={show.youtube_url}
	>
		<Icon name="youtube" />
	</a>
{/if}
<a
	class="icon"
	title="Listen on Apple Podcasts"
	aria-label="Apple Podcasts"
	target="_blank"
	href="https://podcasts.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678"
>
	<Icon name="apple-podcasts" />
</a>

<style lang="postcss">
	a {
		color: white;
		display: block;
		:global(svg) {
			display: block;
		}
	}
</style>
