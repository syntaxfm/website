<script lang="ts">
	import { position_history_runs } from './seo_charts';

	// A tracked search's Google and YouTube positions across snapshots, #1 at the top

	let {
		google,
		youtube,
		max,
		label
	}: { google: (number | null)[]; youtube: (number | null)[]; max: number; label: string } =
		$props();

	const WIDTH = 72;
	const HEIGHT = 28;

	let lines = $derived([
		{ key: 'google', runs: position_history_runs(google, max, WIDTH, HEIGHT) },
		{ key: 'youtube', runs: position_history_runs(youtube, max, WIDTH, HEIGHT) }
	]);
</script>

<svg width={WIDTH} height={HEIGHT} viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={label}>
	{#each lines as line (line.key)}
		{#each line.runs as run, index (index)}
			{#if run.length > 1}
				<polyline class={line.key} points={run.map((point) => `${point.x},${point.y}`).join(' ')} />
			{:else}
				<circle class={line.key} cx={run[0].x} cy={run[0].y} r="2.5" />
			{/if}
		{/each}
	{/each}
</svg>

<style>
	svg {
		display: block;
		overflow: visible;
	}

	polyline {
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	polyline.google {
		stroke: var(--c-chart-1);
	}

	polyline.youtube {
		stroke: var(--c-chart-2);
	}

	circle.google {
		fill: var(--c-chart-1);
	}

	circle.youtube {
		fill: var(--c-chart-2);
	}
</style>
