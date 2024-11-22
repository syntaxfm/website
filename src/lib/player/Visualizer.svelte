<script lang="ts">
	interface Props {
		audio: HTMLAudioElement;
	}

	let { audio }: Props = $props();

	const audioCtx = new (window.AudioContext || window?.webkitAudioContext)();
	let audioSource = null;
	let isAnimating = true;
	let analyser: AnalyserNode;

	audio.play();
	audioSource = audioCtx.createMediaElementSource(audio);
	analyser = audioCtx.createAnalyser();
	audioSource.connect(analyser);
	analyser.connect(audioCtx.destination);
	analyser.fftSize = 128;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	let barWidth = 10;
	let bars: {
		height: number;
		width: number;
	}[] = $state([]);
	let animationFrameId: number;
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
			analyser?.getByteFrequencyData(dataArray);
			for (let i = 0; i < bufferLength; i++) {
				let barHeight = dataArray[i];

				bars[i] = {
					height: barHeight,
					width: barWidth
				};
			}
		}
		if (isAnimating) {
			animationFrameId = requestAnimationFrame(animate);
		}
	}

	animate();

	audio.addEventListener('pause', function () {
		isAnimating = false;
		cancelAnimationFrame(animationFrameId);
	});

	// When audio is played, resume the animation
	audio.addEventListener('play', function () {
		isAnimating = true;
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
