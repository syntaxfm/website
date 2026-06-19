<script lang="ts">
	import { page } from '$app/state';
	import RankedItems from '$lib/sidebar/RankedItems.svelte';
	import { get_most_popular_content_this_week } from '../feed/feed.remote';

	const ranked = await get_most_popular_content_this_week();
	// Drop the episode currently being viewed so it doesn't rank itself, then cap at 5.
	const items = ranked
		.filter((item) => String(item.number) !== page.params.show_number)
		.slice(0, 5);
</script>

{#if items.length > 0}
	<RankedItems {items} />
{/if}
