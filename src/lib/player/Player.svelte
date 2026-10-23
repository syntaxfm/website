<script lang="ts">
	import { player } from '$state/player';
	import { player_window_status } from '$state/player_window_status';
	import { youtube_player } from '$state/youtube_player';
	import { get_youtube_id } from '$utilities/youtube';
	import AlbumArt from './AlbumArt.svelte';
	import get_show_path from '$utilities/slug';
	import Icon from '../Icon.svelte';
	import ShareButton from '../share/HairButton.svelte';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { enter_fullscreen, open_show_page } from '$lib/videos/video_actions';
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
	let has_video = $derived(Boolean(get_youtube_id($player.current_show?.youtube_url)));
	let is_video = $derived($player.media_kind === 'VIDEO');
	let media_kind_label = $derived(is_video ? 'Switch to Audio' : 'Switch to Video');
	let player_height = $state(0);
	// The title stops short of the action bar, which sits over the top right of the player
	let window_controls_width = $state(0);
	// Only takes up room in the bar while the video is docked
	let has_video_dock = $derived(
		$youtube_player.status !== 'IDLE' &&
			($youtube_player.target === 'DOCK' || !$youtube_player.slot_el) &&
			$player_window_status === 'ACTIVE'
	);
	let dock_el: HTMLDivElement | null = $state(null);
	// Same as --stacked-video-bar in variables.css. max-width rather than range syntax, which older Safari's
	// matchMedia doesn't understand. On small screens the dock sits beside the play buttons, otherwise at the
	// start of the bar.
	const stacked_video_bar = new MediaQuery('(max-width: 809px)');
	let is_stacked_video_bar = $derived(has_video_dock && stacked_video_bar.current);

	$effect(() => {
		document.documentElement.style.setProperty('--player-height', `${player_height}px`);
		// Episode slots behind the bar count as out of view, so the video docks
		youtube_player.set_bottom_inset($player_window_status === 'HIDDEN' ? 0 : player_height);
	});

	// The global YouTube player is positioned over this while docked
	$effect(() => {
		if (!dock_el) return;
		return youtube_player.register_dock(dock_el);
	});
</script>

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
				title={media_kind_label}
				><Icon name={is_video ? 'headphones' : 'video'} title={media_kind_label} /></button
			>
		{/if}
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

	<div class="player-container" class:has-video-dock={has_video_dock}>
		{#if $player_window_status === 'ACTIVE'}
			<AlbumArt />
		{/if}

		{#if has_video_dock && !is_stacked_video_bar}
			<div class="video-dock" bind:this={dock_el}></div>
		{/if}

		<div class="player-content">
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
				style="--media-range-track-height: 5px; --media-range-thumb-height: 15px; --media-range-thumb-border-radius: 0;	--media-range-track-border-radius: 5px; --media-range-bar-color: var(--primary);--media-background-color: transparent; --media-control-background: transparent; width: 100%; --media-font-family: var(--body-font-family); --media-control-hover-background: transparent; "
			>
				<audio
					ontimeupdate={player.ontimeupdate}
					onplay={player.onplay}
					ondurationchange={player.ondurationchange}
					onended={player.onended}
					onpause={player.onpause}
					slot="media"
					bind:this={$player.audio}
					preload="metadata"
					crossorigin="anonymous"
				></audio>
				{#if $player_window_status === 'ACTIVE'}
					<media-control-bar class="media-bar">
						<div class="media-top">
							{#if is_stacked_video_bar}
								<!-- Too small for the video's own buttons, they go in the window controls instead -->
								<div class="video-dock" data-actions="external" bind:this={dock_el}></div>
							{/if}
							<div class="media-controls">
								<media-seek-backward-button notooltip>
									<span slot="icon">
										<Icon name="back-30" />
									</span>
								</media-seek-backward-button>
								<media-play-button notooltip>
									<span slot="play" style="--icon_size: 26px;">
										<Icon name="play" />
									</span>
									<span slot="pause" style="--icon_size: 26px;">
										<Icon name="pause" />
									</span>
								</media-play-button>
								<media-seek-forward-button notooltip>
									<span slot="icon">
										<Icon name="forward-30" />
									</span>
								</media-seek-forward-button>
							</div>
						</div>
						<!-- The stacked bar swaps in its own rate button and combined time, the others are hidden with CSS -->
						<div class="media-range">
							<media-time-display aria-hidden={is_stacked_video_bar}></media-time-display>
							<div class="media-range-bookmarks">
								<media-time-range
									style:--media-range-bar-color="var(--white)"
									style:--media-range-thumb-background="var(--primary)"
								></media-time-range>
							</div>
							<media-duration-display aria-hidden={is_stacked_video_bar}></media-duration-display>
							<media-playback-rate-button
								class="docked-rate"
								notooltip
								aria-hidden={!is_stacked_video_bar}
							></media-playback-rate-button>
							<media-time-display
								class="time-with-duration"
								showduration
								aria-hidden={!is_stacked_video_bar}
							></media-time-display>
						</div>
						<div class="media-sound">
							<media-playback-rate-button notooltip aria-hidden={is_stacked_video_bar}
							></media-playback-rate-button>
							<media-mute-button notooltip></media-mute-button>
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

	/* Only lays anything out on mobile with the video docked, the video sits beside the controls */
	.media-top {
		display: contents;
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
		background-color: var(--player-bg, var(--black));
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

	.minimize :global(svg) {
		transition: 0.3s ease rotate;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.player {
		--player-bg: var(--bg-root);
		container: player / inline-size;
		position: fixed;
		bottom: 0;
		width: 100%;
		color: var(--fg);
		background-color: var(--player-bg, var(--black));
		background-image: var(--bg-grit-dark);
		background-size: 400px;
		box-shadow: 0 -5px 10px 0 oklch(var(--blacklch) / 0.4);
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
		align-items: center;
		gap: 25px;

		&.has-video-dock {
			@media (--stacked-video-bar) {
				display: grid;
				grid-template-columns: minmax(0, 1fr);
				grid-template-areas:
					'title'
					'controls';
				gap: 10px;
				padding: 10px;

				/* Shown from --above-med, but the video takes its place here */
				> :global(.art-wrapper) {
					display: none;
				}

				.player-content {
					display: contents;
				}

				/* At the top beside the action bar like on desktop, cut off with an ellipsis before it */
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
					grid-template-columns: auto auto 1fr auto;
					/* The flexible rows take the space left by the taller video, keeping the controls packed together */
					grid-template-rows: 1fr auto auto auto 1fr;
					grid-template-areas:
						'video . . .'
						'video controls range rate'
						'video . time .'
						'video actions volume .'
						'video . . .';
					gap: 0 8px;
				}

				.video-actions {
					/* Same column as the play buttons, so the same width, centered under them */
					grid-area: actions;
					justify-self: stretch;
					justify-content: center;
					display: flex;
					gap: 6px;

					/* Compact like the share button, without the default button padding */
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

				.media-top {
					display: contents;
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
		border-radius: var(--brad);
		background: var(--black);
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
	button {
		--button-bg: transparent;
		--button-fg: var(--fg);
	}
</style>
