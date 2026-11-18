<script lang="ts">
	import { page } from '$app/state';
	import RankedItems from '#lib/sidebar/RankedItems.svelte';
	import { get_most_popular_content_this_week } from '../feed/feed.remote';
	import { get_shown_popular } from './ranked';

	const ranked = await get_most_popular_content_this_week();
	const items = get_shown_popular(ranked, page.params.show_number);
</script>

{#if items.length > 0}
	<RankedItems title="_MOST_POPULAR_THIS_WEEK()" {items} />
{/if}
