<script lang="ts">
	import type { StatTile } from './seo_charts';
	import { format_change, format_count, format_percent, format_share_change } from './seo_format';
	import Sparkline from './Sparkline.svelte';

	let { tiles }: { tiles: StatTile[] } = $props();

	function value_text(tile: StatTile): string {
		return tile.format === 'percent' ? format_percent(tile.value) : format_count(tile.value);
	}

	function change_text(tile: StatTile): string {
		const text =
			tile.format === 'percent' ? format_share_change(tile.change) : format_change(tile.change);
		return text || 'No change';
	}
</script>

<dl class="stat-tiles">
	{#each tiles as tile (tile.label)}
		{#if tile.value !== null}
			<div class="stat-tile">
				<dt>{tile.label}</dt>
				<dd class="stat-value">{value_text(tile)}</dd>
				{#if tile.change !== null}
					<dd class="stat-change">{change_text(tile)}</dd>
				{/if}
				{#if tile.trend.length > 1}
					<dd>
						<Sparkline
							values={tile.trend}
							label={`${tile.label} over the last ${tile.trend.length} snapshots`}
						/>
					</dd>
				{/if}
			</div>
		{/if}
	{/each}
</dl>

<style>
	.stat-tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--pad-medium);
		margin: 0;
	}

	.stat-tile {
		display: grid;
		align-content: start;
		gap: var(--pad-xsmall);
		padding: var(--pad-medium);
		border: 1px solid var(--admin-border);
		border-radius: var(--br-medium);
	}

	dt {
		font-size: var(--fs-2);
		color: var(--admin-muted);
	}

	dd {
		margin: 0;
	}

	.stat-value {
		font-size: var(--fs-6);
		font-variation-settings: var(--fv-600);
		line-height: 1.1;
	}

	.stat-change {
		font-size: var(--fs-2);
		color: var(--admin-muted);
	}
</style>
