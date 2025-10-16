<script lang="ts">
	import type { Show } from '@prisma/client';
	import FeedItemShow from './FeedItemShow.svelte';

	type Props = {
		show: Show;
	};

	const { show }: Props = $props();
</script>

<!-- TODO make this if item type === show, swag social ect -->
{#if show}
	<FeedItemShow {show} />
{/if}

<style>
	img {
		border-radius: 20px;
		border: solid 12px var(--c-primary);
		width: 100%;
	}

	.number {
		font-size: 160px;
		color: var(--c-primary);
		margin: 0;
		line-height: 0;
		display: block;
		text-align: right;
	}
</style>
