<!-- If you want to have a page title. Simply return { meta_title: 'new title', from any loader }  same for description and OG image`-->
<script lang="ts">
	import social_banner from '$assets/syntax-banner.png';
	export let meta_description = `Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences.`;
	export let meta_image = social_banner;
	export let meta_title = `Syntax - A Tasty Treats Podcast for Web Developers.`;
</script>

<svelte:head>
	<title>{meta_title}</title>
	<meta name="theme-color" content="#000000" />
	<meta property="og:type" content="website" />

	<meta property="og:title" content={meta_title} />
	<meta property="twitter:title" content={meta_title} />

	<meta property="og:description" content={meta_description} />
	<meta name="description" content={meta_description} />

	<meta property="og:image" content={meta_image} />
	<meta property="og:image:secure_url" content={meta_image} />
	<meta property="twitter:image" content={meta_image} />
	<meta property="twitter:card" content="summary_large_image" />
</svelte:head>
