<!-- If you want to have a page title. Simply return { title: 'new title', from any loader }  same for description and OG image`-->
<script lang="ts">
	export let meta: {
		title: string;
		image: string;
		description: string;
	};

	$: ({ title, description, image } = meta);
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
