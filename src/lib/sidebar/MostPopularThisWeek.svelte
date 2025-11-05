<script lang="ts">
	import RankedItems from '$lib/sidebar/RankedItems.svelte';
	import { get_most_popular_content_this_week } from '../feed/feed.remote';

	const items = await get_most_popular_content_this_week();
</script>

<RankedItems {items} />
