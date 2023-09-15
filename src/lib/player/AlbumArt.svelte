<script lang="ts">
	import CD from './CD.svelte';
	import Album from './Album.svelte';
	import { player } from '$state/player';

	let isAnimating = true;
	let image_index = 0;

	$player?.audio?.addEventListener('pause', function () {
		isAnimating = false;
	});

	// When audio is played, resume the animation
	$player?.audio?.addEventListener('play', function () {
		isAnimating = true;
	});
</script>

<div class="art-wrapper" on:click={() => (image_index = image_index ? 0 : 1)}>
	{#if image_index === 0}
		<Album />
	{:else}
		<CD spinning={isAnimating} />
	{/if}
</div>

<style>
	.art-wrapper {
		width: 92px;
	}
</style>
