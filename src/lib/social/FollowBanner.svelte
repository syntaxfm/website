<script lang="ts">
	import { fly } from 'svelte/transition';
	import PlatformLinks from '$lib/layout/PlatformLinks.svelte';
	import prefooter from './prefooter.png';

	const speed = 169;
	let since_start = $state(Date.now() - 1499256000000);

	let interval: ReturnType<typeof setInterval>;
	$effect(() => {
		interval = setInterval(() => {
			since_start = Date.now() - 1499256000000;
		}, 500);
		return () => clearInterval(interval);
	});

	let digits = $derived(since_start.toString().split(''));
</script>

<img src={prefooter} />
<!-- TODO make this a flip transition -->

<p>
	Empowering developers for over
	<span class="count fv-700-i">
		{#each digits as digit, i (i)}
			<span class="digit">
				{#key digit}
					<span
						class="digit-value"
						in:fly={{ duration: speed, y: -15, delay: i * 10 }}
						out:fly={{ duration: speed, y: 15, delay: i * 10 }}>{digit}</span
					>
				{/key}
			</span>
		{/each}
	</span>
	milliseconds!
</p>

<PlatformLinks />

<style>
	img {
		margin: 2rem auto;
	}

	p {
		max-width: 24rem;
		margin: 0 auto 2rem;
		text-align: center;
		font-size: var(--fs-4);
	}

	.count {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* Each digit is a fixed slot; the outgoing/incoming values stack in one grid cell
	   so a swap never changes width (no neighbour shove), and overflow clips the
	   fly for a clean slot-machine roll. */
	.digit {
		display: inline-grid;
		overflow: hidden;
	}

	.digit-value {
		grid-area: 1 / 1;
	}
</style>
