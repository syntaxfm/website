<script lang="ts">
	import CD from './CD.svelte';
	import Album from './Album.svelte';
	import { player } from '$state/player';

	let isAnimating = true;
	let image_index = 0;

	$: if ($player?.audio) {
		$player?.audio?.addEventListener('pause', function () {
			isAnimating = false;
		});

		// When audio is played, resume the animation
		$player?.audio?.addEventListener('play', function () {
			isAnimating = true;
		});
	}

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.keyCode === 13) {
			toggle_sicman();
		}
	}

	function toggle_sicman() {
		return (image_index = image_index ? 0 : 1);
	}
</script>

{#if $player.status !== 'MINIMIZED'}
	<div class="art-wrapper" on:click={toggle_sicman} tabindex="0" on:keydown={keydown} role="button">
		{#if image_index === 0}
			<Album />
		{:else}
			<CD spinning={isAnimating} />
		{/if}
	</div>
{/if}

<style lang="postcss">
	.art-wrapper {
		width: 90px;
		height: 85px;
		cursor: pointer;
		flex-shrink: 0;
		display: none;
		@media (--above_med) {
			display: block;
		}
	}
</style>
