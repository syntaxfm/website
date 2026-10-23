<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		audio: HTMLAudioElement;
	}

	let { audio: audio_prop }: Props = $props();
	const audio = untrack(() => audio_prop);

	const audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
	let is_animating = true;
	let analyser: AnalyserNode;

	audio.play();
	const audio_source = audio_ctx.createMediaElementSource(audio);
	analyser = audio_ctx.createAnalyser();
	audio_source.connect(analyser);
	analyser.connect(audio_ctx.destination);
	analyser.fftSize = 128;
	const buffer_length = analyser.frequencyBinCount;
	const data_array = new Uint8Array(buffer_length);
	let bar_width = 10;
	let bars: {
		height: number;
		width: number;
	}[] = $state([]);
	let animation_frame_id: number;
	let fps = 30; // desired FPS
	let now;
	let then = Date.now();
	let interval = 1000 / fps;
	let delta;

	function animate() {
		now = Date.now();
		delta = now - then;

		if (delta > interval) {
			then = now - (delta % interval);
			bars = [];
			analyser?.getByteFrequencyData(data_array);
			for (let i = 0; i < buffer_length; i++) {
				let bar_height = data_array[i];

				bars[i] = {
					height: bar_height,
					width: bar_width
				};
			}
		}
		if (is_animating) {
			animation_frame_id = requestAnimationFrame(animate);
		}
	}

	animate();

	audio.addEventListener('pause', function () {
		is_animating = false;
		cancelAnimationFrame(animation_frame_id);
	});

	// When audio is played, resume the animation
	audio.addEventListener('play', function () {
		is_animating = true;
		animate();
	});
</script>

<div class="visualizer">
	{#each bars as bar, i (`bar-${i}`)}
		{#if bar}
			<div
				class="bar"
				style="height:{100 * (bar.height / 255)}%; background: var(--primary); flex: 1 1 0;"
			></div>
		{/if}
	{/each}
</div>

<style lang="postcss">
	.visualizer {
		gap: 5px;
		height: 60px;
		width: 100%;
		overflow: hidden;
		display: none;
		@media (--above-med) {
			display: flex;
		}
	}
</style>
