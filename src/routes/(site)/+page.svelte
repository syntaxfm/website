<script lang="ts">
	import { page } from '$app/state';
	import Feed from '#lib/feed/Feed.svelte';
	import FeedSidebar from '#lib/feed/FeedSidebar.svelte';
	import HomeHero from '#lib/videos/HomeHero.svelte';
	import { podcast_series_schema, to_json_ld } from '#lib/seo/structured_data.ts';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<svelte:element this={"script"} type="application/ld+json"
		>{to_json_ld(podcast_series_schema(page.url.origin))}</svelte:element
	>
</svelte:head>

<h1 class="visually-hidden">Syntax Podcast</h1>

<HomeHero video={data.hero_video} show={data.hero_show} debug={data.debug_live_stream} />

<section class="layout-sidebar">
	<Feed />
	<FeedSidebar />
</section>
