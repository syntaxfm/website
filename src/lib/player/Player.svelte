<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { player } from '$state/player';
	import { player_window_status } from '$state/player_window_status';
	import { youtube_player } from '$state/youtube_player';
	import AlbumArt from './AlbumArt.svelte';
	import { resolve } from '$app/paths';
	import get_show_path from '$utilities/slug';
	import Icon from '../Icon.svelte';
	import ShareButton from '../share/HairButton.svelte';
	import { get_latest_podcast } from '#lib/shows/shows.remote.ts';
	import { get_id_from_url } from '#lib/videos/utils.ts';
	import { enter_fullscreen, open_show_page } from '#lib/videos/video_actions.ts';

	const show = await get_latest_podcast();
	player.initialize(show);

	let mix_max_verb = $derived($player_window_status === 'MINI' ? 'Maximize' : 'Minimize');
	let has_video = $derived(Boolean(get_id_from_url($player.current_show?.youtube_url)));
	let is_video = $derived($player.media_kind === 'VIDEO');
	let media_kind_label = $derived(is_video ? 'Switch to Audio' : 'Switch to Video');
	let player_height = $state(0);
	// The title stops short of the window controls, which sit over the top right of the player
	let window_controls_width = $state(0);
	// Only takes up room in the bar while the video is docked
	let has_video_dock = $derived(
		$youtube_player.status !== 'IDLE' &&
			($youtube_player.target === 'DOCK' || !$youtube_player.slot_el) &&
			$player_window_status === 'ACTIVE'
	);
	let dock_el: HTMLDivElement | null = $state(null);
	// Same breakpoint as the stacked bar's styles below. On small screens the dock sits beside the
	// play buttons, otherwise at the start of the bar.
	const stacked_video_bar = new MediaQuery('(max-width: 809px)');
	let is_stacked_video_bar = $derived(has_video_dock && stacked_video_bar.current);

	// Keeps the page aware of the bar's height. It's measured, so there's no event to hang this on.
	$effect(() => {
		document.documentElement.style.setProperty('--player-height', `${player_height}px`);
		// Episode slots behind the bar count as out of view, so the video docks
		youtube_player.set_bottom_inset($player_window_status === 'HIDDEN' ? 0 : player_height);
	});

	// The global YouTube player is positioned over this while docked
	function capture_dock(element: HTMLDivElement): () => void {
		dock_el = element;
		const unregister = youtube_player.register_dock(element);
		return () => {
			unregister();
			if (dock_el === element) dock_el = null;
		};
	}

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

	function save_if_hidden() {
		if (document.visibilityState === 'hidden') player.save_now();
	}
</script>

<!-- Positions are only saved every few seconds while playing, so save when the tab closes or goes to the background -->
<svelte:window onpagehide={player.save_now} />
<svelte:document onvisibilitychange={save_if_hidden} />

<section
	class="player {$player_window_status} {$player.status}"
	bind:offsetHeight={player_height}
	style:--window-controls-width="{window_controls_width}px"
>
	<div class="window-controls" bind:offsetWidth={window_controls_width}>
		{#if has_video}
			<button
				onclick={() => player.set_media_kind(is_video ? 'AUDIO' : 'VIDEO')}
				aria-label={media_kind_label}
				title={media_kind_label}><Icon name={is_video ? 'headphones' : 'video'} /></button
			>
		{/if}
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

	<div class="player-container" class:has-video-dock={has_video_dock}>
		{#if $player_window_status === 'ACTIVE'}
			<AlbumArt />
		{/if}

		{#if has_video_dock && !is_stacked_video_bar}
			<div class="video-dock" {@attach capture_dock}></div>
		{/if}

		<div class="player-content stack" style:--stack-gap="0.5rem">
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
					ondurationchange={player.ondurationchange}
					onended={player.onended}
					onpause={player.onpause}
					slot="media"
					preload="metadata"
					crossorigin="anonymous"
				></audio>
				{#if $player_window_status === 'ACTIVE'}
					<media-control-bar class="media-bar">
						<div class="media-top">
							{#if is_stacked_video_bar}
								<!-- Too small for the video's own buttons, they go below the play buttons instead -->
								<div class="video-dock" data-actions="external" {@attach capture_dock}></div>
							{/if}
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
						</div>
						<!-- The stacked bar swaps in its own rate button and combined time, the others are hidden with CSS -->
						<div class="media-range">
							<media-time-display aria-hidden={is_stacked_video_bar}></media-time-display>
							<div class="media-range-bookmarks">
								<media-time-range
									style:--media-range-bar-color="var(--c-white)"
									style:--media-range-thumb-background="var(--c-primary)"
								></media-time-range>
							</div>
							<media-duration-display aria-hidden={is_stacked_video_bar}></media-duration-display>
							<media-playback-rate-button class="docked-rate" aria-hidden={!is_stacked_video_bar}
							></media-playback-rate-button>
							<media-time-display
								class="time-with-duration"
								showduration
								aria-hidden={!is_stacked_video_bar}
							></media-time-display>
						</div>
						<div class="media-sound">
							<media-playback-rate-button aria-hidden={is_stacked_video_bar}
							></media-playback-rate-button>
							<media-mute-button></media-mute-button>
							<media-volume-range></media-volume-range>
						</div>
						{#if is_stacked_video_bar && $player.current_show}
							<!-- The docked video is too small for its own buttons -->
							<div class="video-actions">
								<button
									onclick={open_show_page}
									aria-label={`Watch episode ${$player.current_show.number} on its page`}
									title="Watch on episode page"><Icon name="undock" /></button
								>
								<button
									onclick={enter_fullscreen}
									aria-label="Full screen video"
									title="Full screen"><Icon name="fullscreen" /></button
								>
							</div>
						{/if}
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

	/* Only lays anything out on small screens with the video docked, the video sits beside the controls */
	.media-top {
		display: contents;
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

	.player-container {
		padding: 10px 20px;
		width: 100%;
		min-width: 0;
		max-width: 100%;
		display: flex;
		align-items: center;
		gap: 25px;

		&.has-video-dock {
			@media (width < 810px) {
				display: grid;
				grid-template-columns: minmax(0, 1fr);
				grid-template-areas:
					'title'
					'controls';
				gap: 10px;
				padding: 10px;

				/* The video takes the album art's place */
				> :global(.art-wrapper) {
					display: none;
				}

				.player-content {
					display: contents;
				}

				/* At the top beside the window controls, cut off with an ellipsis before them */
				.player-content > p {
					grid-area: title;
					margin: 0;
					padding-right: var(--window-controls-width);
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				media-controller {
					grid-area: controls;
					display: block;
					width: 100%;
					min-width: 0;
				}

				.media-bar {
					width: 100%;

					/* The flexible rows take the space left by the taller video, keeping the controls packed together */
					grid-template:
						'video . . .' 1fr
						'video controls range rate' auto
						'video . time .' auto
						'video actions volume .' auto
						'video . . .' 1fr
						/ auto auto 1fr auto;
					gap: 0 8px;
				}

				.video-actions {
					/* Same column as the play buttons, so the same width, centered under them */
					grid-area: actions;
					justify-self: stretch;
					justify-content: center;
					display: flex;
					gap: 6px;

					button {
						display: grid;
						place-items: center;
						padding: 0;
					}
				}

				.media-range {
					display: contents;
				}

				.media-sound {
					grid-area: volume;
					display: flex;
					justify-content: flex-end;
					align-items: center;
					min-width: 0;
				}

				.media-range-bookmarks {
					grid-area: range;
				}

				.video-dock {
					grid-area: video;
					width: 120px;
					margin-right: 4px;
				}

				.media-controls {
					grid-area: controls;
					align-items: center;
					gap: 8px;
				}

				.docked-rate {
					grid-area: rate;
					align-self: center;
					display: inline-flex;
				}

				/* The seek bar's track sits mid-row, so this pulls the text up to about 2px under it */
				.time-with-duration {
					grid-area: time;
					display: inline-flex;
					justify-self: end;
					line-height: 1;
					margin-top: -8px;
				}

				media-mute-button,
				media-volume-range {
					flex-shrink: 0;
				}

				/* Half media-chrome's default 100px */
				media-volume-range {
					width: 50px;
				}

				.media-range > media-time-display:not(.time-with-duration),
				media-duration-display,
				.media-sound media-playback-rate-button {
					display: none;
				}
			}
		}
	}

	.player-content {
		flex-grow: 1;
		min-width: 0;
	}

	.time-with-duration,
	.docked-rate {
		display: none;
	}

	.video-dock {
		flex-shrink: 0;
		align-self: center;
		width: 200px;
		aspect-ratio: 16 / 9;
		border-radius: var(--br-medium);
		background: var(--c-black);
	}

	.player {
		--player-bg: var(--c-black);

		/* Measured and set inline, the title on small screens stops short of the window controls */
		--window-controls-width: 0px;

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

	/* The bar is always black, so its buttons take its white text rather than the theme's foreground */
	button {
		background: transparent;
		color: inherit;
		padding: 0;
	}

	media-seek-backward-button,
	media-play-button,
	media-seek-forward-button {
		line-height: 0;
	}
</style>
