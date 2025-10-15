<script lang="ts">
	import FeedItem from '$/lib/feed/FeedItem.svelte';
	import FeedTitle from '$/lib/feed/FeedTitle.svelte';
	import MostPopularThisWeek from '$/lib/sidebar/MostPopularThisWeek.svelte';
	import TrendingTopics from '$/lib/sidebar/TrendingTopics.svelte';

	import { getFeed } from '$lib/feed/feed.remote';
</script>

<h1 class="visually-hidden">Syntax Podcast</h1>

<!-- Video Header -->

<!-- Graphic  Hero -->

<!-- Today's Feed -->

<section class="layout-sidebar">
	<section>
		<FeedTitle />
		<svelte:boundary>
			{#each await getFeed() as post}
				<FeedItem show={post} />
			{/each}
			{#snippet pending()}{/snippet}
		</svelte:boundary>
	</section>
	<aside>
		<svelte:boundary>
			<MostPopularThisWeek />
			<TrendingTopics />
			<!-- 3d skateboard -->
			<!-- Newsletter Signup -->

			<!-- Fetured Guests -->
			<!-- Staff Picks -->
			<!-- Fan Favorites -->
			<!-- Recent Shorts -->
			{#snippet pending()}{/snippet}
		</svelte:boundary>
	</aside>
</section>
