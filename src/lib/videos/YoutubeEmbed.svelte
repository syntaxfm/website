<script lang="ts">
	import { youtube_player } from '$state/youtube_player';
	import type { PlayerShow } from '$state/player_utils';
	import VideoPoster from './VideoPoster.svelte';
	import { get_id_from_url } from './utils';
	import { youtube_slot } from './video_actions';

	interface Props {
		show: PlayerShow;
		// The episode's own page, where its video goes back to from the player bar
		is_show_page?: boolean;
		// How wide the picture renders, so the browser picks the smallest sharp file
		sizes?: string;
	}

	let {
		show,
		is_show_page = true,
		sizes = '(min-width: 1200px) 1136px, calc(100vw - 4rem)'
	}: Props = $props();

	// An episode's video, big enough to watch here. It's only the video's picture until the visitor
	// plays it. The global player is then laid over this, so the video keeps playing (docked in the
	// player bar) after leaving the page.
	let video_id = $derived(get_id_from_url(show.youtube_url));
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
	function play() {
		if (slot_el) void youtube_player.play_in_slot(show, slot_el);
	}

	function prewarm() {
		youtube_player.prewarm(show);
	}
</script>

{#if video_id}
	<div
		bind:this={slot_el}
		{@attach youtube_slot(show.number, is_show_page)}
		class="youtube-embed"
		data-testid="youtube-embed"
	>
		<VideoPoster
			{video_id}
			{label}
			{sizes}
			onplay={play}
			onwarm={prewarm}
			is_docked={is_docked_from_here}
		/>
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
</style>
