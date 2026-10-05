<script lang="ts">
	import { page } from '$app/state';
	import { player } from '$state/player';
	import { format } from 'date-fns';
	import { tsToS } from '$utilities/format_time.js';
	import PodcastPost from '$lib/articles/PodcastPost.svelte';

	let { data, children } = $props();
	let { show } = $derived(data);

	// Timestamp links in the show notes (`#t=mm:ss`) play this show from that time.
	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLAnchorElement && target.matches(`a[href*='#t=']`)) {
			e.preventDefault();
			const href = target.getAttribute('href');
			const timestamp = href ? tsToS(href.replace('#t=', '')) : 0;
			// If we aren't already playing this episode, load it up and then jump it
			if ($player.current_show?.number !== show.number) {
				await player.start_show(show, timestamp);
			} else {
				// Jump to timestamp, then resume if this show is only loaded or paused
				player.update_time(timestamp);
				if ($player.status !== 'PLAYING') player.play();
			}
		}
	}

	let show_schema = $derived({
		'@context': 'https://schema.org/',
		'@type': 'PodcastEpisode',
		url: page.url,
		name: show.title,
		datePublished: format(show.date, 'yyyy-LL-dd'),
		// TODO: add duration once we are saving it
		// timeRequired: 'PT37M',
		description: show.aiShowNote?.description,
		associatedMedia: {
			'@type': 'MediaObject',
			contentUrl: show.url
		},
		partOfSeries: {
			'@type': 'PodcastSeries',
			name: 'Syntax',
			url: 'https://syntax.fm'
		}
	});
	// Escape `<` and `&` as JSON unicode escapes: the text can never close the script element and
	// is left untouched by Svelte's text escaping, while JSON parsers decode it back to the same data.
	let show_schema_json = $derived(
		JSON.stringify(show_schema, null, 2).replaceAll('<', '\\u003c').replaceAll('&', '\\u0026')
	);
</script>

<!-- Capture phase: claim the click before SvelteKit's router treats it as hash navigation -->
<svelte:document onclickcapture={handleClick} />

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json">{show_schema_json}</svelte:element>
</svelte:head>

<PodcastPost {show}>
	{@render children()}
</PodcastPost>
