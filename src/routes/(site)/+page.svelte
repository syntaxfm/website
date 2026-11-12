<script lang="ts">
	import Feed from '#lib/feed/Feed.svelte';
	import FeedSidebar from '#lib/feed/FeedSidebar.svelte';
	import HomeHero from '#lib/videos/HomeHero.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<h1 class="visually-hidden">Syntax Podcast</h1>

<HomeHero video={data.hero_video} show={data.hero_show} debug={data.debug_live_stream} />

<section class="layout-sidebar">
	<Feed />
	<FeedSidebar />
</section>
