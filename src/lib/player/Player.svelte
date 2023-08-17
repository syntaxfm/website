<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import { fly, slide } from 'svelte/transition';
	import Visualizer from './Visualizer.svelte';
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

	$: if ($player.audio) {
		$player.audio.crossOrigin = 'anonymous';
		$player.audio.play();
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

		{#if $player.audio}
			<Visualizer audio={$player.audio} />
		{/if}

		<div class="player-container">
			<media-controller
				audio
				style="--media-range-track-height: 20px; --media-range-thumb-height: 20px; --media-range-thumb-border-radius: 0;	--media-range-bar-color: var(--primary);--media-background-color: transparent; --media-control-background: transparent; width: 100%; --media-font-family: var(--body-font-family); --media-control-hover-background: transparent; "
			>
				<audio
					slot="media"
					src={$player.current_show?.url}
					bind:this={$player.audio}
					preload="metadata"
				/>
				<media-control-bar class="media-bar">
					<div class="media-controls">
						<media-seek-backward-button />
						<media-play-button style="--media-button-icon-height: 40px;" />
						<media-seek-forward-button />
					</div>
					<div class="media-range">
						<media-time-display />
						<div class="media-range-bookmarks">
							<!-- {#if time_stamps}
								<Bookmarks {time_stamps} />
							{/if} -->
							<media-time-range />
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

	.media-bar {
		display: grid;
		grid-template-rows: [start top] auto [top bottom] auto [bottom end];
		grid-template-columns: [start controls] auto [controls range] auto [range end];
		@container (min-width: 650px) {
			grid-template-columns: [start controls] auto [controls range] 1fr [range sound] auto [sound end];
			grid-template-rows: 1fr;
			grid-column: range / range;
		}
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

	media-time-range {
		width: 100%;
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

	:global(.player) {
		--player-bg: var(--blackish);
		container: player / inline-size;
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

	.media-range-bookmarks {
		position: relative;
		width: 100%;
	}

	media-time-display,
	media-time-range {
		padding: 0;
	}
</style>
