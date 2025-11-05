<script lang="ts">
	import { page } from '$app/state';
	import { player } from '$state/player';
	import { format } from 'date-fns';
	import { tsToS } from '$utilities/format_time.js';
	import PodcastPost from '$lib/articles/PodcastPost.svelte';

	let { data, children } = $props();
	let { show, time_start } = $derived(data);

	// TODO figure out what this is doing
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
				// Jump to timestamp

				player.update_time(timestamp);
			}
		}
	}

	const showSchema = {
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
	};
</script>

<svelte:head>
	{@html `<script type="application/ld+json">\n${JSON.stringify(showSchema, null, 2)}\n</script>`}
</svelte:head>

<PodcastPost {show} {time_start}>
	{@render children()}
</PodcastPost>
