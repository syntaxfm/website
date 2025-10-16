<script lang="ts">
	import RankedItems from '$lib/sidebar/RankedItems.svelte';
	import { getMostPopularThisWeek } from '../feed/feed.remote';

	const items = await getMostPopularThisWeek();
</script>

<RankedItems {items} />
