<script lang="ts">
	import { get } from 'svelte/store';
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { player_window_status } from '$state/player_window_status';
	import get_show_path from '$utilities/slug';
	import { get_youtube_watch_url } from '$utilities/youtube';
	import Icon from '$lib/Icon.svelte';

	let video_el: YoutubeVideoElementLike | null = $state(null);

	let active_show = $derived($youtube_player.active_show);
	let show_mini_player = $derived(
		Boolean(active_show && $youtube_player.status !== 'IDLE' && $youtube_player.in_mini_player)
	);
	let is_minimized = $derived($youtube_player.is_minimized);
	let is_dismissed = $derived($youtube_player.is_dismissed);
	let min_max_verb = $derived(is_minimized ? 'Maximize' : 'Minimize');
	let watch_url = $derived(active_show ? get_youtube_watch_url(active_show.youtube_url) : null);

	$effect(() => {
		const el = video_el;
		const show = active_show;
		if (!el || !show || !show_mini_player) return;

		const state = get(youtube_player);
		const resume_time = state.current_time;
		youtube_player.set_active_element(el);
		void (async () => {
			try {
				if (el.loadComplete) {
					await el.loadComplete;
				}
				if (resume_time > 0 && Math.abs((el.currentTime || 0) - resume_time) > 1) {
					el.currentTime = resume_time;
				}
				if (get(youtube_player).status === 'PLAYING') {
					await el.play();
				}
			} catch {
				// ignore
			}
		})();

		let last_duration = 0;
		let last_time = -1;
		const sync_interval = setInterval(() => {
			const current = get(youtube_player);
			if (current.active_element !== el) return;

			const dur = el.duration;
			if (typeof dur === 'number' && Number.isFinite(dur) && dur > 0 && dur !== last_duration) {
				last_duration = dur;
				el.dispatchEvent(new Event('durationchange'));
			}

			const ct = el.currentTime;
			if (typeof ct === 'number' && !Number.isNaN(ct) && ct > 0 && Math.abs(ct - last_time) > 0.05) {
				last_time = ct;
				youtube_player.update_time(show.number, ct, el);
				el.dispatchEvent(new Event('timeupdate'));
			}
		}, 250);

		return () => {
			clearInterval(sync_interval);
			if (typeof el.currentTime === 'number' && el.currentTime > 0) {
				youtube_player.update_time(show.number, el.currentTime);
			}
		};
	});

	function handle_play() {
		if (active_show) {
			youtube_player.set_mini_player_playing(video_el);
			if (video_el && video_el.duration > 0) {
				video_el.dispatchEvent(new Event('durationchange'));
			}
		}
	}

	function handle_timeupdate() {
		if (active_show && video_el && typeof video_el.currentTime === 'number') {
			youtube_player.update_time(active_show.number, video_el.currentTime, video_el);
		}
	}

	function handle_pause() {
		if (active_show) {
			youtube_player.set_paused(active_show.number, video_el);
		}
	}
</script>

{#if show_mini_player && active_show && watch_url}
	<aside
		class="youtube-mini-player"
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
					onclick={() => youtube_player.toggle_minimize()}
					aria-label={`${min_max_verb} Video Player`}
					title={`${min_max_verb} Video Player`}
				>
					<Icon name="minimize" />
				</button>
				<button
					type="button"
					class="mini-player-close"
					onclick={() => youtube_player.dismiss_mini_player()}
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
				ontimeupdate={handle_timeupdate}
				onseeked={handle_timeupdate}
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
			bottom: 110px;
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

