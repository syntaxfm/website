<script lang="ts">
	import { rank_tier } from './seo_charts';
	import { format_position } from './seo_format';

	// A position as a chip toned by how good it is, with its move since the last snapshot

	let {
		position,
		move = '',
		href = null,
		title
	}: {
		position: number | null;
		// From format_position_move: "▲ 3", "▼ 2", "new", "dropped" or ""
		move?: string;
		// The page that ranks, when there is one
		href?: string | null;
		title?: string;
	} = $props();

	let direction = $derived(
		move.startsWith('▲') || move === 'new'
			? 'up'
			: move.startsWith('▼') || move === 'dropped'
				? 'down'
				: null
	);
</script>

<span class="rank-chip" {title}>
	{#if href}
		<a class="rank" data-tier={rank_tier(position)} {href} target="_blank" rel="noopener noreferrer"
			>{format_position(position)}</a
		>
	{:else}
		<span class="rank" data-tier={rank_tier(position)}>{format_position(position)}</span>
	{/if}
	{#if move}
		<small data-direction={direction}>{move}</small>
	{/if}
</span>

<style>
	.rank-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xsmall);
		white-space: nowrap;
	}

	.rank {
		display: inline-block;
		min-inline-size: 3.25em;
		padding: 0.1em 0.5em;
		font-variant-numeric: tabular-nums;
		text-align: center;
		color: var(--admin-fg);
		background-color: var(--admin-surface);
		border-radius: var(--br-small);
	}

	a.rank:hover {
		outline: 1px solid var(--admin-border-strong);
	}

	.rank[data-tier='top'] {
		background-color: var(--c-green-5);
	}

	.rank[data-tier='page'] {
		background-color: var(--c-yellow-4);
	}

	.rank[data-tier='none'] {
		color: var(--admin-muted);
		background-color: transparent;
	}

	small {
		font-size: var(--fs-1);
		font-variant-numeric: tabular-nums;
		color: var(--admin-muted);
	}

	small[data-direction='up'] {
		color: var(--c-chart-3);
	}

	small[data-direction='down'] {
		color: var(--admin-danger);
	}
</style>
