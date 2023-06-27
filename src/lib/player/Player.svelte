<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import { fly, slide } from 'svelte/transition';

	let audio: HTMLAudioElement | undefined;

	$: if (audio) {
		console.log('audio loaded');
		audio.play();
	}
</script>

{#if $player.status === 'ACTIVE' || $player.status === 'EXPANDED'}
	<section class={`player ${$player.status}`} transition:fly={{ y: '100%' }}>
		<header>
			<button class="player-expand" on:click={player.toggle_expand}><Icon name="expand" /></button>
			<p>Episode #{$player.current_show?.number} - {$player.current_show?.title}</p>
			<button on:click={player.close}>×</button>
		</header>

		{#if $player.status === 'EXPANDED'}
			<div transition:slide>
				<!-- TODO -->
				<h2>
					Hi This is the expanded player. would be a good place for things like a time stamped
					transcript.
				</h2>
			</div>
		{/if}

		<div class="player-container">
			<media-controller
				audio
				style="--media-range-track-height: 20px; --media-range-thumb-height: 20px; --media-range-thumb-border-radius: 0;	--media-range-bar-color: var(--primary);--media-background-color: transparent; --media-control-background: transparent; width: 100%; --media-font-family: var(--body-font-family); --media-control-hover-background: transparent;"
			>
				<audio slot="media" src={$player.current_show?.url} bind:this={audio} />
				<media-control-bar style="width: 100%; align-items: center;">
					<media-seek-backward-button />

					<media-play-button style="--media-button-icon-height: 40px;" />
					<media-seek-forward-button />
					<media-time-display />
					<media-time-range />
					<media-duration-display />
					<media-playback-rate-button />
					<media-mute-button />
					<media-volume-range />
				</media-control-bar>
			</media-controller>
		</div>
	</section>
{/if}

<style lang="postcss">
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		background: var(--black);
	}

	button {
		--button-bg: transparent;
		--button-color: var(--color);
	}

	p {
		margin: 0;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.EXPANDED .player-expand {
		rotate: 180deg;
	}

	.player {
		padding: 0 0 20px;
		position: fixed;
		bottom: 0;
		width: 100vw;
		color: var(--color);
		background-color: var(--player-bg, var(--blackish));
		box-shadow: 0 0 10px 0 oklch(var(--blacklch) / 0.2);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.player-container {
		padding: 20px;
		width: 100%;
	}
</style>
