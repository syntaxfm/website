<script lang="ts">
	import { get } from 'svelte/store';
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { get_youtube_watch_url } from '$utilities/youtube';

	interface Props {
		show: {
			number: number;
			title: string;
			slug: string;
			youtube_url?: string | null;
		};
		is_show_page?: boolean;
	}

	let { show, is_show_page = false }: Props = $props();

	let watch_url = $derived(get_youtube_watch_url(show.youtube_url));
	let wrap_el: HTMLDivElement | null = $state(null);
	let video_el: YoutubeVideoElementLike | null = $state(null);

	$effect(() => {
		const num = show.number;
		const el = video_el;
		const container = wrap_el;
		const on_show_page = is_show_page;
		if (!el || !container) return;

		youtube_player.register_embed(num, el, container, on_show_page);

		if (on_show_page) {
			const state = get(youtube_player);
			if (state.active_show?.number === num) {
				youtube_player.dock_to_show_page(num, el);
			}
		}

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
				youtube_player.update_time(num, ct, el);
				el.dispatchEvent(new Event('timeupdate'));
			}
		}, 250);

		function check_visibility() {
			if (!container || !el) return;
			const current = get(youtube_player);
			if (current.active_show?.number !== num) return;
			if (current.origin_element !== el) return;

			const rect = container.getBoundingClientRect();
			const viewport_height = window.innerHeight || document.documentElement.clientHeight;

			// Pop out as soon as even a few pixels of the video scroll past the top or bottom of the viewport
			const is_out_of_view = rect.top < -4 || rect.bottom > viewport_height + 4;

			if (is_out_of_view && !current.in_mini_player && current.status === 'PLAYING') {
				youtube_player.enter_mini_player_from_scroll(num, el);
			} else if (!is_out_of_view && current.in_mini_player) {
				youtube_player.dock_to_inline(num, el);
			}
		}

		window.addEventListener('scroll', check_visibility, { passive: true });
		window.addEventListener('resize', check_visibility, { passive: true });

		return () => {
			clearInterval(sync_interval);
			window.removeEventListener('scroll', check_visibility);
			window.removeEventListener('resize', check_visibility);
			youtube_player.unregister_embed(num, el, on_show_page);
		};
	});

	function handle_play() {
		youtube_player.set_playing(show, video_el);
		if (video_el && video_el.duration > 0) {
			video_el.dispatchEvent(new Event('durationchange'));
		}
	}

	function handle_timeupdate() {
		if (video_el && typeof video_el.currentTime === 'number') {
			youtube_player.update_time(show.number, video_el.currentTime, video_el);
		}
	}

	function handle_pause() {
		youtube_player.set_paused(show.number, video_el);
	}

	function stop_propagation(e: Event) {
		e.stopPropagation();
	}
</script>

{#if watch_url}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={wrap_el}
		class="youtube-embed-wrap"
		data-testid="youtube-embed"
		data-show-number={show.number}
		onclick={stop_propagation}
	>
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
{/if}

<style lang="postcss">
	.youtube-embed-wrap {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: var(--brad);
		overflow: hidden;
		background: var(--black);
		position: relative;
		z-index: 2;
	}

	youtube-video {
		display: block;
		width: 100%;
		height: 100%;
		aspect-ratio: 16 / 9;
	}
</style>
