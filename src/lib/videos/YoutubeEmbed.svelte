<script lang="ts">
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { record_duration } from '$state/media_timeline';
	import type { PlayerShow } from '$state/player_utils';
	import Icon from '$lib/Icon.svelte';
	import { get_watch_url_from_url } from './utils';
	import { youtube_slot } from './video_actions';

	interface Props {
		show: PlayerShow;
	}

	let { show }: Props = $props();

	// The show page's video. It's only a preview: the global player is laid over it when it plays,
	// so the video keeps playing (docked in the player bar) after leaving the page.
	let watch_url = $derived(get_watch_url_from_url(show.youtube_url));
	let slot_el: HTMLDivElement | null = $state(null);

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
</script>

{#if watch_url}
	<div
		bind:this={slot_el}
		{@attach youtube_slot(show.number, true)}
		class="youtube-embed"
		data-testid="youtube-embed"
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
			onclick={handle_click}
			onpointerenter={prewarm}
			onfocus={prewarm}
			aria-label={label}
			title={label}
		>
			{#if is_docked_from_here}
				<span><Icon name="expand" /></span>
			{/if}
		</button>
	</div>
{/if}

<style>
	.youtube-embed {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;

		/* The global player copies this radius when it's laid over the embed */
		border-radius: var(--embed-radius, var(--br-medium));
		background: var(--c-black);
	}

	youtube-video {
		display: block;
		width: 100%;
		height: 100%;
	}

	button {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: pointer;

		span {
			position: absolute;
			top: 10px;
			right: 10px;
			display: grid;
			place-items: center;
			padding: 8px;
			border-radius: var(--br-medium);
			background: color-mix(in lch, var(--c-black), transparent 30%);
			color: var(--c-white);
		}
	}
</style>
