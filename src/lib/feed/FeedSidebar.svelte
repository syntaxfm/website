<script lang="ts">
	import type { Snippet } from 'svelte';
	import SwaggyNewsletterForm from '#lib/newsletter/SwaggyNewsletterForm.svelte';
	import MostPopularThisWeek from '#lib/sidebar/MostPopularThisWeek.svelte';
	import TrendingTopics from '#lib/sidebar/TrendingTopics.svelte';

	// A page's own block (a topic page's Key Moments), after Most Popular
	let { children }: { children?: Snippet } = $props();
</script>

<!-- Beside every feed: Home and the tag pages -->
<aside class="stack">
	<MostPopularThisWeek />
	{@render children?.()}
	<TrendingTopics />
	<!-- 3d skateboard -->
	<SwaggyNewsletterForm />
	<!-- FileReader Guests -->
	<!-- Staff Picks -->
	<!-- Fan Favorites -->
	<!-- Recent Shorts -->
</aside>
