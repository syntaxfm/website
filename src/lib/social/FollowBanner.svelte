<script lang="ts">
	import { fly } from 'svelte/transition';
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

	<span>
		{#each Array.from({ length: digits.length }, (_, i) => i) as i}
			<span>
				{#key `${digits.at(i)}-${i + 1}`}
					<span
						in:fly={{ duration: speed, y: -15, delay: i * 10 }}
						out:fly={{ duration: speed, y: 15, delay: i * 10 }}>{digits.at(i)}</span
					>
				{/key}
			</span>
		{/each} milliseconds</span
	>
</p>

<style>
	img {
		margin: 2rem auto;
	}
</style>
