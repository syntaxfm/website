<script lang="ts">
	import type { Show } from '@prisma/client';
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { record_duration } from '$state/media_timeline';
	import { get_youtube_watch_url } from '$utilities/youtube';
	import Icon from '$lib/Icon.svelte';

	interface Props {
		show: Show;
		is_show_page?: boolean;
	}

	let { show, is_show_page = false }: Props = $props();

	let watch_url = $derived(get_youtube_watch_url(show.youtube_url));
	let slot_el: HTMLDivElement | null = $state(null);

	// This embed is only a preview, the global player is laid over this slot when it plays
	$effect(() => {
		if (!slot_el) return;
		return youtube_player.register_slot({
			show_number: show.number,
			slot_el,
			is_show_page
		});
	});

	let is_docked_from_here = $derived(
		$youtube_player.status !== 'IDLE' &&
			$youtube_player.slot_el === slot_el &&
			$youtube_player.target === 'DOCK'
	);
	let label = $derived(
		is_docked_from_here
			? `Bring video back to episode ${show.number}`
			: `Play episode ${show.number}`
	);

	// Also how a docked video comes back here, it doesn't on scroll
	function handle_click() {
		if (slot_el) void youtube_player.play_in_slot(show, slot_el);
	}

	// The preview knows the video's length before it's ever played, which timestamps use to tell
	// whether the audio and video timelines line up
	function handle_durationchange(e: Event) {
		const el = e.currentTarget as YoutubeVideoElementLike;
		record_duration(show.number, 'VIDEO', el.duration);
	}

	function prewarm() {
		youtube_player.prewarm(show);
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
		bind:this={slot_el}
		class="youtube-embed-wrap"
		data-testid="youtube-embed"
		data-show-number={show.number}
		onclick={stop_propagation}
	>
		<!-- Never plays, the overlay catches clicks before YouTube gets them -->
		<youtube-video
			inert
			controls
			playsinline
			src={watch_url}
			ondurationchange={handle_durationchange}
		></youtube-video>
		<button
			type="button"
			class="embed-overlay"
			onclick={handle_click}
			onpointerenter={prewarm}
			onfocus={prewarm}
			aria-label={label}
			title={label}
		>
			{#if is_docked_from_here}
				<span class="restore"><Icon name="expand" /></span>
			{/if}
		</button>
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

	.embed-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
	}

	.restore {
		position: absolute;
		top: 10px;
		right: 10px;
		display: grid;
		place-items: center;
		padding: 8px;
		border-radius: var(--brad);
		background: oklch(var(--blacklch) / 0.7);
		color: var(--white);
	}
</style>
