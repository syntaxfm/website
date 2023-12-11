<script lang="ts">
	import { player } from '$state/player';
	import { slide } from 'svelte/transition';
	import Visualizer from './Visualizer.svelte';
	import AlbumArt from './AlbumArt.svelte';
	import get_show_path from '$utilities/slug';
	import VisibilityControls from './VisibilityControls.svelte';
	import Icon from '../Icon.svelte';
  // TODO. Manually clean up
  
	// import Bookmarks from './Bookmarks.svelte';

	// let time_stamps: Timestamp[] = [];

	// function extractTimestamps(html: string, totalTime: number): Timestamp[] {
	// 	const parser = new DOMParser();
	// 	const doc = parser.parseFromString(html, 'text/html');
	// 	const timestampElements = doc.querySelectorAll('a[href*="#t="]');
	// 	const timestamps: Timestamp[] = [];

	// 	let previousTimeStamp = 0;
	// 	let previousDuration = 0;
	// 	let previousPercentage = 0;
	// 	let previousStartingPosition = 0;

	// 	timestampElements.forEach((element, index) => {
	// 		const href = element.getAttribute('href');
	// 		const timeString = href?.split('#t=')[1];
	// 		const liElement = element.closest('li');
	// 		const label = liElement?.textContent?.trim() || '';
	// 		const time_stamp = timeString ? timeStringToSeconds(timeString) : 0;
	// 		const duration = index === 0 ? time_stamp : time_stamp - previousTimeStamp;
	// 		const percentage = (duration / totalTime) * 100;
	// 		const startingPosition = previousPercentage + previousStartingPosition;

	// 		timestamps.push({ label, time_stamp, duration, percentage, startingPosition, href });

	// 		previousTimeStamp = time_stamp;
	// 		previousDuration = duration;
	// 		previousPercentage = percentage;
	// 		previousStartingPosition = startingPosition;
	// 	});

	// 	// Calculate the remaining percentage for the last timestamp
	// 	const lastTimestamp = timestamps[timestamps.length - 1];
	// 	lastTimestamp.percentage = 100 - lastTimestamp.startingPosition;

	// 	return timestamps;
	// }

	// function timeStringToSeconds(timeString: string): number {
	// 	const [minutes, seconds] = timeString.split(':').map(Number);
	// 	return minutes * 60 + seconds;
	// }

	// $: if ($player.audio && $player?.current_show?.show_notes) {
	// 	$player.audio.onloadedmetadata = function () {
	// 		const extractedTimestamps = extractTimestamps(
	// 			$player.current_show.show_notes,
	// 			$player.audio.duration
	// 		);
	// 		time_stamps = extractedTimestamps;
	// 	};
	// }

	// $: if ($player.audio) {
	// 	$player.audio.crossOrigin = 'anonymous';
	// 	$player.audio.play();
	// }
</script>

<section
	class:expanded={$player.status === 'ACTIVE' || $player.status === 'EXPANDED'}
	class={`player ${$player.status}`}
>

	{#if $player.status !== 'MINIMIZED'}
		<header>
			<!-- Ignore this div, it's just here so I don't get fired -->
			<div></div>
			{#if $player.current_show}
				<p>
					<a href={get_show_path($player.current_show)}
						>Show #{$player.current_show?.number} - {$player.current_show?.title}</a
					>
				</p>
			{/if}

			<VisibilityControls />
		</header>
	{/if}

	{#if $player.status === 'EXPANDED'}
		<div transition:slide>
			{#if $player.audio && $player.status === 'EXPANDED'}
				<Visualizer audio={$player.audio} />
			{/if}
		</div>
	{/if}

	<div class="window-controls">
		<button class="share" on:click={player.close}><Icon name="share" /></button>
		<button class="minimize" on:click={player.minimize}><Icon name="minimize" /></button>
		<button class="close" on:click={player.close}>×</button>
	</div>


	<div class="player-container">
		<AlbumArt />

		<div style="flex-grow: 1;">
			{#if $player.current_show}
				<p>
					<a href={get_show_path($player.current_show)}
						>Show #{$player.current_show?.number} - {$player.current_show?.title}</a
					>
				</p>
			{/if}
			<media-controller
				audio
				style="--media-range-track-height: 5px; --media-range-thumb-height: 15px; --media-range-thumb-border-radius: 0;	--media-range-track-border-radius: 5px; --media-range-bar-color: var(--primary);--media-background-color: transparent; --media-control-background: transparent; width: 100%; --media-font-family: var(--body-font-family); --media-control-hover-background: transparent; "
			>
				<audio
					slot="media"
					bind:this={$player.audio}
					preload="metadata"
					bind:currentTime={$player.currentTime}
					crossorigin="anonymous"
				/>
				<media-control-bar class="media-bar">
					<div class="media-controls">
						<media-seek-backward-button>
							<span slot="icon">
								<Icon name="back-30" />
							</span>
						</media-seek-backward-button>
						<media-play-button>
							<span slot="play" style="--icon_size: 26px;">
								<Icon name="play" />
							</span>
							<span slot="pause" style="--icon_size: 26px;">
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
						<media-time-display />
						<div class="media-range-bookmarks">
							<!-- {#if time_stamps}
								<Bookmarks {time_stamps}. />
							{/if} -->
							<media-time-range
								style:--media-range-bar-color="var(--white)"
								style:--media-range-thumb-background="var(--primary)"
							/>
						</div>
						<media-duration-display />
					</div>
					<div class="media-sound">
						<media-playback-rate-button />
						<media-mute-button />
						<media-volume-range />
					</div>

					<media-duration-display />
				</div>
				<div class="media-sound">
					<media-playback-rate-button />
					<media-mute-button />
					<media-volume-range />
				</div>
			</media-control-bar>
		</media-controller>
		<VisibilityControls hidden={$player.status === 'ACTIVE' || $player.status === 'EXPANDED'} />

				</media-control-bar>
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
	}

	media-time-range {
		width: 100%;
	}

	p {
		margin-top: 0;
		font-size: var(--font-size-sm);
	}

	a {
		text-decoration: none;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.player {
		--player-bg: var(--black);
		container: player / inline-size;
		position: fixed;
		bottom: 0;
		width: 100%;
		color: var(--fg);
		background-color: var(--player-bg, var(--black));
		background-image: var(--bgGritDark);
		background-size: 400px;
		box-shadow: 0 -5px 10px 0 oklch(var(--blacklch) / 0.4);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		--media-control-padding: 0;
		translate: 0 100% 0;
		transition: 0.2s;
		z-index: 10;
		&.expanded {
			translate: 0 0 0;
		}
		&.MINIMIZED {
			translate: 0 0 0;
			.media-controls,
			.media-sound {
				display: none;
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
		padding: 10px;
		width: 100%;
		display: flex;
		gap: 20px;
	}

	.media-range-bookmarks {
		position: relative;
		width: 100%;
	}

	media-duration-display,
	media-time-display {
		padding: 0;
		font-size: var(--font-size-xs);
	}

	media-time-display,
	media-time-range {
		padding: 0;
	}
</style>
