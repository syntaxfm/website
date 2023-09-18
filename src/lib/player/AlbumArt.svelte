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

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.keyCode === 13) {
			toggle_sicman();
		}
	}

	function toggle_sicman() {
		return (image_index = image_index ? 0 : 1);
	}
</script>

<div class="art-wrapper" on:click={toggle_sicman} tabindex="0" on:keydown={keydown} role="button">
	{#if image_index === 0}
		<Album />
	{:else}
		<CD spinning={isAnimating} />
	{/if}
</div>

<style>
	.art-wrapper {
		width: 92px;
		height: 85px;
		cursor: pointer;
		flex-shrink: 0;
	}
</style>
