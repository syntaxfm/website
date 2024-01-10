<script lang="ts">
	import CD from './CD.svelte';
	import Album from './Album.svelte';
	import { player, player_window_status } from '$state/player';
	import { PUBLIC_URL } from '$env/static/public';
	import { Show } from '@prisma/client';

	export let is_link = false;
	export let show: Show = null;

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

{#if $player_window_status !== 'MINI'}
	{#if is_link}
		<a class="art-wrapper" href="https://{PUBLIC_URL}/{show.number}">
			<Album />
		</a>
	{:else}
		<div
			class="art-wrapper"
			on:click={toggle_sicman}
			tabindex="0"
			on:keydown={keydown}
			role="button"
		>
			{#if image_index === 0}
				<Album />
			{:else}
				<CD spinning={isAnimating} />
			{/if}
		</div>
	{/if}
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
