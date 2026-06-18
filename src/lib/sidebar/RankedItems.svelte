<script lang="ts">
	import RankedItem from './RankedItem.svelte';
	import SidebarTitle from './SidebarTitle.svelte';
	import type { RankedContent } from './ranked';

	type Props = {
		items: RankedContent[];
	};
	let { items }: Props = $props();
</script>

<div>
	<SidebarTitle title="_MOST_POPULAR_THIS_WEEK()" />
	<div class="ranked-items stack">
		{#each items as item, index (item.id)}
			<RankedItem {item} rank={index + 1} />
		{/each}
	</div>
</div>

<style>
	.ranked-items {
		position: relative;
		gap: 20px;

		&::before {
			content: '';
			display: block;
			width: 2px;
			height: 100%;
			background-color: var(--c-fg-1);
			position: absolute;
			left: 15px;
			top: 0;
			z-index: -1;
		}
	}
</style>
