<script lang="ts">
	import type { BarRow } from './seo_charts';

	// Horizontal bars in one hue: one row per item, value at the bar's tip

	let { rows }: { rows: BarRow[] } = $props();

	let max_value = $derived(Math.max(0, ...rows.map((row) => row.value)));
</script>

<ul class="bar-list">
	{#each rows as row (row.key)}
		<li>
			<span class="bar-label">{row.label}</span>
			<span class="bar-track" aria-hidden="true">
				{#if row.value > 0}
					<span class="bar" style:inline-size="{(row.value / max_value) * 100}%"></span>
				{/if}
			</span>
			<span class="bar-value">{row.value_text}</span>
			{#if row.detail}
				<span class="bar-detail">{row.detail}</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.bar-list {
		container-type: inline-size;
		display: grid;
		gap: var(--pad-small);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(6rem, 16rem) minmax(0, 1fr) 5rem 3rem;
		align-items: center;
		gap: var(--pad-small);
		font-size: var(--fs-2);
	}

	.bar-track {
		display: block;
	}

	.bar {
		display: block;
		min-inline-size: 2px;
		block-size: 16px;
		background: var(--c-chart-1);
		border-radius: 0 var(--br-small) var(--br-small) 0;
	}

	.bar-value {
		font-variant-numeric: tabular-nums;
		text-align: end;
	}

	.bar-detail {
		color: var(--admin-muted);
		font-variant-numeric: tabular-nums;
	}

	@container (width < 32rem) {
		li {
			grid-template-columns: minmax(0, 1fr) 4.5rem 2.5rem;
		}

		.bar-label {
			grid-column: 1 / -1;
		}
	}
</style>
