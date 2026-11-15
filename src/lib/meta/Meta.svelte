<script lang="ts">
	import { page } from '$app/state';
	import { PODCAST_FEED_URL, SITE_DESCRIPTION } from '$const';
	const props = $props();

	let title = `Syntax - Web Development Podcast`;

	let meta = $derived({
		//·defaults
		description: SITE_DESCRIPTION,
		image: `${page.url.protocol}//${page.url.host}/og/${encodeURIComponent(
			page.data.meta?.title || title
		)}.jpg`,
		title,
		// any page customizations
		...page.data.meta,
		...props
	});

	function generateTitle(title: string) {
		if (title.toLowerCase().includes('syntax')) return title;
		return `${title} - Syntax`;
	}
</script>

<svelte:head>
	<title>{generateTitle(meta.title)}</title>
	<link
		rel="alternate"
		type="application/rss+xml"
		href={PODCAST_FEED_URL}
		title="Syntax RSS Feed"
	/>
	<meta name="image" property="og:image" content={meta.image} />
	<meta name="theme-color" content="#000000" />
	{#if meta.canonical}
		<link rel="canonical" href={meta.canonical} />
	{/if}
	<!-- OG -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={generateTitle(meta.title)} />
	<meta property="og:description" content={meta.description} />
	{#if meta.canonical}
		<meta property="og:url" content={meta.canonical} />
	{/if}
	<meta name="description" content={meta.description} />
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={generateTitle(meta.title)} />
	<meta name="twitter:site" content="@syntaxfm" />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
</svelte:head>
