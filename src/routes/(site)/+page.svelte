<script lang="ts">
	import Feed from '$lib/feed/Feed.svelte';
	import SwaggyNewsletterForm from '$lib/newsletter/SwaggyNewsletterForm.svelte';
	// import MostPopularThisWeek from '$lib/sidebar/MostPopularThisWeek.svelte';
	import TrendingTopics from '$lib/sidebar/TrendingTopics.svelte';
	import LiveStream from '$lib/videos/LiveStream.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<h1 class="visually-hidden">Syntax Podcast</h1>

<LiveStream stream={data.live_stream} debug={data.debug_live_stream} />

<section class="layout-sidebar">
	<Feed />
	<aside>
		<!-- <MostPopularThisWeek /> -->
		<TrendingTopics />
		<!-- 3d skateboard -->
		<SwaggyNewsletterForm />
		<!-- FileReader Guests -->
		<!-- Staff Picks -->
		<!-- Fan Favorites -->
		<!-- Recent Shorts -->
	</aside>
</section>
