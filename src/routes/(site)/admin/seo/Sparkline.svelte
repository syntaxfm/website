<script lang="ts">
	import { sparkline_points } from './seo_charts';

	let { values, label }: { values: number[]; label: string } = $props();

	const WIDTH = 120;
	const HEIGHT = 32;

	let points = $derived(sparkline_points(values, WIDTH, HEIGHT));
	let last_point = $derived(points.at(-1));
</script>

<svg width={WIDTH} height={HEIGHT} viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={label}>
	<polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
	{#if last_point}
		<circle cx={last_point.x} cy={last_point.y} r="4" />
	{/if}
</svg>

<style>
	svg {
		display: block;
		overflow: visible;
	}

	polyline {
		fill: none;
		stroke: var(--c-chart-1);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	circle {
		fill: var(--c-chart-1);
		stroke: var(--c-bg);
		stroke-width: 2;
	}
</style>
