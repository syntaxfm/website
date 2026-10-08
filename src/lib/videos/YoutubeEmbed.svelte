<script lang="ts">
	import type { Show } from '@prisma/client';
	import { record_duration } from '$state/media_timeline';
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { get_youtube_watch_url } from '$utilities/youtube';

	interface Props {
		show: Show;
		is_show_page?: boolean;
	}

	let { show, is_show_page = false }: Props = $props();

	let watch_url = $derived(get_youtube_watch_url(show.youtube_url));
	let wrap_el: HTMLDivElement | null = $state(null);
	let video_el: YoutubeVideoElementLike | null = $state(null);

	// Visibility (scroll pop-out / docking) and position syncing are handled centrally in the youtube_player store
	$effect(() => {
		if (!video_el || !wrap_el) return;
		return youtube_player.register_embed({
			show_number: show.number,
			video_el,
			container_el: wrap_el,
			is_show_page
		});
	});

	function handle_play() {
		if (video_el) youtube_player.set_playing(show, video_el);
	}

	function handle_pause() {
		if (video_el) youtube_player.set_paused(show.number, video_el);
	}

	function handle_durationchange() {
		if (video_el) record_duration(show.number, 'VIDEO', video_el.duration);
	}

	function stop_propagation(e: Event) {
		e.stopPropagation();
	}
</script>

{#if watch_url}
	<!-- Clicks inside the video shouldn't trigger the card's click-to-navigate -->
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
			onpause={handle_pause}
			ondurationchange={handle_durationchange}
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
