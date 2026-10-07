<script lang="ts">
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { player_window_status } from '$state/player_window_status';
	import get_show_path from '$utilities/slug';
	import { get_youtube_watch_url } from '$utilities/youtube';
	import Icon from '$lib/Icon.svelte';

	let video_el: YoutubeVideoElementLike | null = $state(null);

	let active_show = $derived($youtube_player.active_show);
	let active_show_number = $derived(active_show?.number);
	// Stays mounted (hidden) while any video is active so popping out and docking back
	// don't tear down and reload the YouTube iframe
	let is_mounted = $derived(Boolean(active_show && $youtube_player.status !== 'IDLE'));
	let in_mini_player = $derived($youtube_player.in_mini_player);
	let is_minimized = $derived($youtube_player.is_minimized);
	let is_dismissed = $derived($youtube_player.is_dismissed);
	let min_max_verb = $derived(is_minimized ? 'Maximize' : 'Minimize');
	let watch_url = $derived(active_show ? get_youtube_watch_url(active_show.youtube_url) : null);

	// Pick up playback when the mini-player opens or switches shows, hand it back when it closes.
	// Keyed on the show number, not the show object, so store updates don't re-seek.
	$effect(() => {
		const el = video_el;
		if (!el || active_show_number == null || !in_mini_player) return;
		youtube_player.attach_mini_player(el);
		return () => youtube_player.detach_mini_player(el);
	});

	function handle_play() {
		if (video_el) youtube_player.set_mini_player_playing(video_el);
	}

	function handle_pause() {
		if (active_show && video_el) youtube_player.set_paused(active_show.number, video_el);
	}
</script>

{#if is_mounted && active_show && watch_url}
	<aside
		class="youtube-mini-player"
		class:HIDDEN={!in_mini_player}
		inert={!in_mini_player}
		class:MINI={is_minimized}
		class:DISMISSED={is_dismissed}
		class:audio-player-open={$player_window_status !== 'HIDDEN'}
		data-testid="youtube-mini-player"
		aria-label="YouTube Mini Player"
	>
		<div class="mini-player-header">
			<a href={get_show_path(active_show)} class="mini-player-title">
				#{active_show.number} - {active_show.title}
			</a>
			<div class="mini-player-controls">
				<button
					type="button"
					class="mini-player-minimize"
					onclick={youtube_player.toggle_minimize}
					aria-label={`${min_max_verb} Video Player`}
					title={`${min_max_verb} Video Player`}
				>
					<Icon name="minimize" />
				</button>
				<button
					type="button"
					class="mini-player-close"
					onclick={youtube_player.dismiss_mini_player}
					aria-label="Close Video Player"
					title="Close Video Player"
				>
					×
				</button>
			</div>
		</div>
		<div class="mini-player-video">
			<youtube-video
				bind:this={video_el}
				controls
				playsinline
				src={watch_url}
				onplay={handle_play}
				onplaying={handle_play}
				onpause={handle_pause}
			></youtube-video>
		</div>
	</aside>
{/if}

<style lang="postcss">
	.youtube-mini-player {
		position: fixed;
		right: 20px;
		bottom: 20px;
		width: min(360px, calc(100vw - 40px));
		background: var(--bg-root);
		color: var(--fg-root);
		border: solid var(--border-size) var(--subtle);
		border-radius: var(--brad);
		box-shadow: var(--shadow-6);
		overflow: hidden;
		z-index: 20;
		transition: bottom 0.2s ease;

		&.audio-player-open {
			/* --player-height is set by Player.svelte and follows its minimized state */
			bottom: calc(var(--player-height, 110px) + 20px);
		}

		&.MINI {
			.mini-player-video {
				height: 0;
				aspect-ratio: unset;
				overflow: hidden;
			}

			.mini-player-minimize :global(svg) {
				rotate: 180deg;
			}
		}

		&.HIDDEN {
			/* Not display: none, the YouTube iframe needs to stay rendered to stay ready */
			visibility: hidden;
			pointer-events: none;
		}

		&.DISMISSED {
			height: 0;
			overflow: hidden;
			opacity: 0;
			pointer-events: none;
			border: none;
		}
	}

	.mini-player-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 6px 10px;
		background: var(--black);
		color: var(--white);
		font-size: var(--font-size-xs);
	}

	.mini-player-title {
		color: var(--white);
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		&:hover {
			text-decoration: underline;
		}
	}

	.mini-player-controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.mini-player-minimize,
	.mini-player-close {
		--button-bg: transparent;
		--button-fg: var(--white);
		padding: 0 4px;
		font-size: var(--font-size-base);
		line-height: 1;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
	}

	.mini-player-minimize :global(svg) {
		transition: 0.3s ease rotate;
	}

	.mini-player-video {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: var(--black);
	}

	youtube-video {
		display: block;
		width: 100%;
		height: 100%;
		aspect-ratio: 16 / 9;
	}
</style>
