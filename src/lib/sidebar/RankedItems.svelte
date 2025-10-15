<script lang="ts">
	import RankedItem from './RankedItem.svelte';
	import SidebarTitle from './SidebarTitle.svelte';
	import type { Show } from '@prisma/client';

	type Props = {
		items: Show[];
	};
	let { items }: Props = $props();
</script>

<div>
	<SidebarTitle title="_MOST_POPULAR_SHOWS()" />
	<div class="ranked-items stack">
		{#each items as show, index (show.id)}
			<RankedItem {show} rank={index + 1} />
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
			background-color: var(--c-shade-or-tint);
			position: absolute;
			left: 15px;
			top: 0;
			z-index: -1;
		}
	}
</style>
