<script lang="ts">
	import { navigating } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	let visible = $state(false);
	let progress = $state(0);
	let load_durations: number[] = $state([]);
	let average_load = $derived(load_durations.reduce((a, b) => a + b, 0) / load_durations.length);
	const increment = 1;
	onNavigate((navigation) => {
		const typical_load_time = average_load || 200; //ms
		const frequency = typical_load_time / 100;
		let start = performance.now();
		// Start the progress bar
		visible = true;
		progress = 0;
		const interval = setInterval(() => {
			// Increment the progress bar
			progress += increment;
		}, frequency);
		// Resolve the promise when the page is done loading
		$navigating?.complete.then(() => {
			progress = 100; // Fill out the progress bar
			clearInterval(interval);
			// after 100 ms hide the progress bar
			setTimeout(() => {
				visible = false;
			}, 500);
			// Log how long that one took
			const end = performance.now();
			const duration = end - start;
			load_durations = [...load_durations, duration];
		});
	});
</script>

<div class="progress" class:visible style:--progress={progress}>
	<div class="track"></div>
</div>

<style lang="postcss">
	.progress {
		width: 100%;
		position: fixed;
		z-index: 2;
		top: 0;
		transform: translateY(-100%);
		transition: transform 0.5s;
		&.visible {
			transition: none;
			transform: translateY(0);
		}
	}
	.track {
		height: 4px;
		width: calc(var(--progress, 0) * 1%);
		background: var(--primary);
		border-radius: 0 4px 4px 0;
		transition: width 0.05s;
		.progress.visible & {
			transition: none;
		}
	}
</style>
