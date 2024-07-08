<script lang="ts">
	import { PUBLIC_URL } from '$env/static/public';
	import type { Show } from '@prisma/client';
	import Album from './Album.svelte';
	import { player } from '$/state/player';

	export let is_link = false;
	export let show: Show | null = null;
</script>

{#if is_link && show}
	<a class="art-wrapper" href="https://{PUBLIC_URL}/{show.number}">
		<Album />
	</a>
{:else}
	<div class="art-wrapper" class:loading={$player.status === 'LOADING'}>
		<Album />
		{#if !$player.initial_load}
			{#key $player?.current_show?.id}
				<div class="cd">📀</div>
			{/key}
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
		position: relative;
		@media (--above_med) {
			display: block;
		}
	}
	.cd {
		position: absolute;
		inset: 0;
		font-size: 68px;
		animation:
			spin 0.5s linear 5,
			slide-in 1s ease-in-out 2 alternate;
		transform-origin: center center;
		text-align: center;
		z-index: -1;
	}

	/* Define the second animation */
	@keyframes slide-in {
		80% {
			translate: 35px;
		}
		100% {
			translate: 35px;
		}
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}
</style>
