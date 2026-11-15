<script lang="ts">
	import { page } from '$app/state';
	import { player } from '$state/player';
	import { tsToS } from '$utilities/format_time.js';
	import PodcastPost from '#lib/articles/PodcastPost.svelte';
	import { podcast_episode_schema, to_json_ld } from '#lib/seo/structured_data.ts';

	let { data, children } = $props();
	let { show } = $derived(data);

	// Timestamp links in the show notes (`#t=mm:ss`) play this show from that time.
	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLAnchorElement && target.matches(`a[href*='#t=']`)) {
			e.preventDefault();
			const href = target.getAttribute('href');
			const timestamp = href ? tsToS(href.replace('#t=', '')) : 0;
			// Show note timestamps are on the audio timeline, play_timestamp picks video or audio accordingly
			await player.play_timestamp(show, timestamp);
		}
	}

	let show_schema_json = $derived(to_json_ld(podcast_episode_schema(show, page.url.origin)));
</script>

<!-- Capture phase: claim the click before SvelteKit's router treats it as hash navigation -->
<svelte:document onclickcapture={handleClick} />

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{show_schema_json}</svelte:element>
</svelte:head>

<PodcastPost {show}>
	{@render children()}
</PodcastPost>
