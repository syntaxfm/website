<script lang="ts">
	import type { LatestShow } from '$server/ai/queries';
	export let show: LatestShow;
</script>

<div>
	<a
		target="_blank"
		href="https://open.spotify.com/search/syntax.fm {encodeURI(show.title)}/episodes">Spotify</a
	>
	<a
		target="_blank"
		href="https://podcasts.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678"
		>Apple Podcasts</a
	>
</div>
