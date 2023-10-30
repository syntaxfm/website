<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.data.meta.title}</title>
	<meta name="theme-color" content="#000000" />
	<!-- OG -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={$page.data.meta.title} />
	<meta property="og:description" content={$page.data.meta.description} />
	<meta name="description" content={$page.data.meta.description} />
	<meta property="og:image" content={$page.data.meta.image} />
	<meta property="og:image:secure_url" content={$page.data.meta.image} />
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={$page.data.meta.title} />
	<meta name="twitter:site" content="@syntaxfm" />
	<meta name="twitter:description" content={$page.data.meta.description} />
	<meta name="twitter:image" content={`${$page.data.meta.image}?v=2`} />
</svelte:head>
