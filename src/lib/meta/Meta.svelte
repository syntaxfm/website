<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_URL } from '$env/static/public';

	let title = `Syntax - A Tasty Treats Podcast for Web Developers.`;

	$: meta = {
		//·defaults
		description: `Full Stack Web Developers Wes Bos and Scott Tolinski dive deep into web development, CSS, JavaScript, Frameworks, Typescript, Servers and more. Listen in 3 times a week!`,
		image: `${$page.url.protocol}//${$page.url.host}/og/${encodeURIComponent(
			$page.data.meta.title || title
		)}.jpg`,
		title,
		// any page customizations
		...$page.data.meta
	};

	function generateTitle(title: string) {
		if (title.toLowerCase().includes('syntax')) return title;
		return `${title} - Syntax`;
	}
</script>

<svelte:head>
	<title>{generateTitle(meta.title)}</title>
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
