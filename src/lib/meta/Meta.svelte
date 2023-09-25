<!-- If you want to have a page title. Simply return { meta_title: 'new title', from any loader }  same for description and OG image`-->
<script lang="ts">
	import social_banner from '$assets/syntax-banner.png';
	import { page } from '$app/stores';

	$: title = $page.data.meta_title ?? `Syntax - A Tasty Treats Podcast for Web Developers.`;
	$: description =
		$page.data.meta_description ??
		`Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences.`;
	$: image = $page.data.meta_image ?? social_banner;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="theme-color" content="#000000" />
	<meta property="og:type" content="website" />

	<meta property="og:title" content={title} />
	<meta property="twitter:title" content={title} />

	<meta property="og:description" content={description} />
	<meta name="description" content={description} />

	<meta property="og:image" content={image} />
	<meta property="og:image:secure_url" content={image} />
	<meta property="twitter:image" content={image} />
	<meta property="twitter:card" content="summary_large_image" />
</svelte:head>
