<script lang="ts">
	import { player } from '$state/player';
	import { player_window_status } from '$state/player_window_status';
	import AlbumArt from './AlbumArt.svelte';
	import { resolve } from '$app/paths';
	import get_show_path from '$utilities/slug';
	import Icon from '../Icon.svelte';
	import ShareButton from '../share/HairButton.svelte';
	import { get_latest_podcast } from '$server/shows/shows.remote';

	const show = await get_latest_podcast();
	player.initialize(show);

	let mix_max_verb = $derived($player_window_status === 'MINI' ? 'Maximize' : 'Minimize');

	function capture_media_controller(element: HTMLElement): () => void {
		$player.media_controller = element as HTMLAudioElement;

		return () => {
			if ($player.media_controller === element) $player.media_controller = null;
		};
	}

	function capture_audio(element: HTMLAudioElement): () => void {
		$player.audio = element;

		return () => {
			if ($player.audio === element) $player.audio = null;
		};
	}
</script>

<section class="player {$player_window_status} {$player.status}">
	<div class="window-controls">
		{#if $player.current_show}<ShareButton show={$player.current_show} />{/if}
		<button
			class="minimize"
			onclick={player.toggle_minimize}
			aria-label={`${mix_max_verb} Player`}
			title={`${mix_max_verb} Player`}><Icon name="down" /></button
		>
		<button class="close" onclick={player.close} aria-label="Close Player" title="Close Player"
			><Icon name="close" /></button
		>
	</div>

	<div class="player-container">
		{#if $player_window_status === 'ACTIVE'}
			<AlbumArt />
		{/if}

		<div style="flex-grow: 1;" class="stack" style:--stack-gap="0.5rem">
			{#if $player.current_show}
				<p>
					<a id="player_show_title" href={resolve(get_show_path($player.current_show))}
						>Show #{$player.current_show?.number} - {$player.current_show?.title}</a
					>
				</p>
			{/if}
			<media-controller
				{@attach capture_media_controller}
				audio
				nohotkeys
				style="

--media-range-track-height: 5px; --media-range-thumb-height: 15px; --media-range-thumb-border-radius: 0;	--media-range-track-border-radius: 5px; --media-range-bar-color: var(--c-primary);--media-background-color: transparent; --media-control-background: transparent;

 width: 100%;

 --media-font-family: var(--ff-body); --media-control-hover-background: transparent; "
			>
				<audio
					{@attach capture_audio}
					ontimeupdate={player.ontimeupdate}
					onplay={player.onplay}
					onended={player.onended}
					onpause={player.onpause}
					slot="media"
					preload="metadata"
					crossorigin="anonymous"
				></audio>
				{#if $player_window_status === 'ACTIVE'}
					<media-control-bar class="media-bar">
						<div class="media-controls">
							<media-seek-backward-button>
								<span slot="icon">
									<Icon name="rewind" />
								</span>
							</media-seek-backward-button>
							<media-play-button>
								<span slot="play">
									<Icon name="play" width={34} height={34} />
								</span>
								<span slot="pause">
									<Icon name="pause" />
								</span>
							</media-play-button>
							<media-seek-forward-button>
								<span slot="icon">
									<Icon name="forwards" />
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
		min-width: 0;
		max-width: 100%;
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
		align-items: center;

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
		width: 100%;
	}

	.window-controls {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		padding: 5px 10px;
		background-color: var(--player-bg, var(--c-black));

		:global(button) {
			padding: 10px;
		}
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
		color: var(--c-white);
	}

	.minimize :global(svg) {
		transition: 0.3s ease rotate;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.player-container {
		padding: 10px 20px;
		width: 100%;
		min-width: 0;
		max-width: 100%;
		display: flex;
		gap: 25px;
	}

	.player-container > .stack {
		min-width: 0;
	}

	.player {
		--player-bg: var(--c-black);

		container: player / inline-size;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		width: auto;
		max-width: min(100%, 100vi);
		overflow: hidden;
		color: var(--c-white);
		background-color: var(--player-bg, var(--c-black));
		background-image: var(--c-bg-grit-dark);
		background-size: 400px;
		box-shadow: 0 -5px 10px 0 oklch(from var(--c-black) l c h / 0.4);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		--media-control-padding: 0;

		translate: 0 100% 0;
		transition: 0.2s ease translate;
		z-index: 10;

		&[class~='ACTIVE'] {
			translate: 0 0 0;
		}

		&[class~='MINI'] {
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
		background: transparent;
		color: var(--c-fg);
		padding: 0;
	}

	media-seek-backward-button,
	media-play-button,
	media-seek-forward-button {
		line-height: 0;
	}
</style>
