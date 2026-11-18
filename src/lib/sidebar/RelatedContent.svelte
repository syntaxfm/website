<script lang="ts">
	import { page } from '$app/state';
	import RankedItems from './RankedItems.svelte';
	import { get_most_popular_content_this_week } from '../feed/feed.remote';
	import { get_related_content } from './related.remote';
	import { get_shown_popular } from './ranked';

	// Episodes and videos sharing the most tags with this one (src/server/tags/related.ts)
	type Props = { content_id: string };
	let { content_id }: Props = $props();

	const RELATED_COUNT = 5;

	let related = $derived(await get_related_content(content_id));
	let popular = $derived(await get_most_popular_content_this_week());
	// Most Popular sits right below, so nothing it shows is repeated here
	let items = $derived.by(() => {
		const popular_ids = new Set(
			get_shown_popular(popular, page.params.show_number).map((item) => item.id)
		);
		return related.filter((item) => !popular_ids.has(item.id)).slice(0, RELATED_COUNT);
	});
</script>

{#if items.length > 0}
	<RankedItems title="_RELATED()" {items} />
{/if}
