<script lang="ts">
	import { player } from '$state/player';
	import { player_window_status } from '$state/player_window_status';
	import AlbumArt from './AlbumArt.svelte';
	import get_show_path from '$utilities/slug';
	import Icon from '../Icon.svelte';
	import ShareButton from '../share/HairButton.svelte';
	import { onMount } from 'svelte';
	import type { Show } from '@prisma/client';

	interface Props {
		initial_show: Show;
	}

	let { initial_show }: Props = $props();

	onMount(() => {
		// Load latest show by default
		player.initialize(initial_show);
	});

	let mix_max_verb = $derived($player_window_status === 'MINI' ? 'Maximize' : 'Minimize');
</script>

<section class="player {$player_window_status} {$player.status}">
	<div class="window-controls">
		{#if $player.current_show}<ShareButton show={$player.current_show} />{/if}
		<button
			class="minimize"
			onclick={player.toggle_minimize}
			aria-label={`${mix_max_verb} Player`}
			title={`${mix_max_verb} Player`}><Icon name="minimize" /></button
		>
		<button class="close" onclick={player.close} aria-label="Close Player" title="Close Player"
			>×</button
		>
	</div>

	<div class="player-container">
		{#if $player_window_status === 'ACTIVE'}
			<AlbumArt />
		{/if}

		<div style="flex-grow: 1;">
			{#if $player.current_show}
				<p>
					<a id="player_show_title" href={get_show_path($player.current_show)}
						>Show #{$player.current_show?.number} - {$player.current_show?.title}</a
					>
				</p>
			{/if}
			<media-controller
				audio
				nohotkeys
				bind:this={$player.media_controller}
				style="

--media-range-track-height: 5px; --media-range-thumb-height: 15px; --media-range-thumb-border-radius: 0;	--media-range-track-border-radius: 5px; --media-range-bar-color: var(--c-primary);--media-background-color: transparent; --media-control-background: transparent;

 width: 100%;

 --media-font-family: var(--ff-body); --media-control-hover-background: transparent; "
			>
				<audio
					ontimeupdate={player.ontimeupdate}
					onplay={player.onplay}
					onended={player.onended}
					onpause={player.onpause}
					slot="media"
					bind:this={$player.audio}
					preload="metadata"
					crossorigin="anonymous"
				></audio>
				{#if $player_window_status === 'ACTIVE'}
					<media-control-bar class="media-bar">
						<div class="media-controls">
							<media-seek-backward-button>
								<span slot="icon">
									<Icon name="back-30" />
								</span>
							</media-seek-backward-button>
							<media-play-button>
								<span
									slot="play"
									style="

--icon_size: 26px;"
								>
									<Icon name="play" />
								</span>
								<span
									slot="pause"
									style="

--icon_size: 26px;"
								>
									<Icon name="pause" />
								</span>
							</media-play-button>
							<media-seek-forward-button>
								<span slot="icon">
									<Icon name="forward-30" />
								</span>
							</media-seek-forward-button>
						</div>
						<div class="media-range">
							<media-time-display></media-time-display>
							<div class="media-range-bookmarks">
								<media-time-range
									style:--media-range-bar-color="var(--c-white)"
									style:--media-range-thumb-background="var(--c-primary)"
								></media-time-range>
							</div>
							<media-duration-display></media-duration-display>
						</div>
						<div>
							<media-playback-rate-button></media-playback-rate-button>
							<media-mute-button></media-mute-button>
							<media-volume-range></media-volume-range>
						</div>
					</media-control-bar>
				{/if}
			</media-controller>
		</div>
	</div>
</section>

<style lang="postcss">
	.media-bar {
		display: grid;
		grid-template-rows: [start top] auto [top bottom] auto [bottom end];
		grid-template-columns: [start controls] auto [controls range] auto [range end];
		height: 100%;
		align-items: center;
		gap: 20px;

		@container (min-width: 650px) {
			grid-template-columns: [start controls] auto [controls range] 1fr [range sound] auto [sound end];
			grid-template-rows: 1fr;
			grid-column: range / range;
		}
	}

	media-controller {
		flex-grow: 1;
	}

	.media-range {
		grid-row: top / top;
		grid-column: start / end;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;

		@container (min-width: 650px) {
			grid-column: range / range;
			grid-row: 1;
		}
	}

	.media-controls {
		grid-column: controls / controls;
		grid-row: bottom / bottom;
		display: flex;
		gap: 16px;
		align-items: baseline;

		@container (min-width: 650px) {
			grid-column: controls / controls;
			grid-row: 1;
		}
	}

	.media-control-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		width: 100;
	}

	.window-controls {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		padding: 5px 10px;
		background-color: var(--player-bg, var(--c-black));
	}

	media-time-range {
		width: 100%;
	}

	p {
		margin-top: 0;
		font-size: var(--fs-3);
	}

	a {
		text-decoration: none;
	}

	.minimize :global(svg) {
		transition: 0.3s ease rotate;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.player {
		--player-bg: var(--c-bg);

		container: player / inline-size;
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		color: var(--c-fg);
		background-color: var(--player-bg, var(--c-black));
		background-image: var(--c-bg-grit-dark);
		background-size: 400px;
		box-shadow: 0 -5px 10px 0 oklch(var(--c-blacklch) / 0.4);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		--media-control-padding: 0;

		translate: 0 100% 0;
		transition: 0.2s ease translate;
		z-index: 10;

		&.ACTIVE {
			translate: 0 0 0;
		}

		&.MINI {
			translate: 0 0 0;

			media-controller {
				overflow: hidden;
				height: 0;
				position: absolute;
			}

			.minimize {
				:global(svg) {
					rotate: 180deg;
				}
			}

			p {
				margin: 0;
			}

			.media-range {
				width: 100%;
			}

			.media-bar,
			.player-container {
				height: max-content;
				padding: 10px;
			}

			media-control-bar {
				display: flex;
				width: 100%;
				align-items: center;
			}
		}
	}

	.player-container {
		padding: 10px 20px;
		width: 100%;
		display: flex;
		gap: 25px;
	}

	.media-range-bookmarks {
		position: relative;
		width: 100%;
	}

	media-duration-display,
	media-time-display {
		padding: 0;
		font-size: var(--fs-2);
	}

	media-time-display,
	media-time-range {
		padding: 0;
	}

	button {
		--button-bg: transparent;
		--button-fg: var(--c-fg);
	}
</style>
