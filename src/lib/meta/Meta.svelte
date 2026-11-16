<script lang="ts">
	// The site's only head tags for search and sharing, rendered once by the (site) layout. A page
	// sets its own through `meta` in its load (App.PageData), never with a second copy of these tags.
	import { page } from '$app/state';
	import { PODCAST_FEED_URL, SITE_DESCRIPTION } from '$const';

	const DEFAULT_TITLE = 'Syntax - Web Development Podcast';

	// Field by field, so a page's empty description (an episode without AI notes) keeps the site's
	let meta = $derived.by(() => {
		const title = page.data.meta?.title || DEFAULT_TITLE;
		return {
			title,
			description: page.data.meta?.description || SITE_DESCRIPTION,
			// A page's address without its query is its canonical, unless the page says otherwise
			// (an episode reached by a wrong slug, a numbered page of a list). Error pages have none.
			canonical: page.error
				? undefined
				: page.data.meta?.canonical || `${page.url.origin}${page.url.pathname}`,
			published: page.data.meta?.published,
			modified: page.data.meta?.modified,
			noindex: page.data.meta?.noindex,
			image:
				page.data.meta?.image ||
				`${page.url.protocol}//${page.url.host}/og/${encodeURIComponent(title)}.jpg`
		};
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
	{#if meta.noindex}
		<meta name="robots" content="noindex" />
	{:else if meta.canonical}
		<link rel="canonical" href={meta.canonical} />
	{/if}
	<!-- OG -->
	{#if meta.published}
		<meta property="og:type" content="article" />
		<meta property="article:published_time" content={meta.published} />
		{#if meta.modified}
			<meta property="article:modified_time" content={meta.modified} />
		{/if}
	{:else}
		<meta property="og:type" content="website" />
	{/if}
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
