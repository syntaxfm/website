<script lang="ts">
	import { youtube_player } from '$state/youtube_player';
	import type { PlayerShow } from '$state/player_utils';
	import Icon from '#lib/Icon.svelte';
	import { get_id_from_url, get_thumbnail_from_id, get_thumbnail_srcset_from_id } from './utils';
	import { youtube_slot } from './video_actions';

	interface Props {
		show: PlayerShow;
	}

	let { show }: Props = $props();

	// The show page's video. It's only the video's picture: YouTube's player (17 requests, 1.1 MB)
	// loads when the visitor goes to play it. The global player is laid over this when it plays,
	// so the video keeps playing (docked in the player bar) after leaving the page.
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
	function handle_click() {
		if (slot_el) void youtube_player.play_in_slot(show, slot_el);
	}

	function prewarm() {
		youtube_player.prewarm(show);
	}
</script>

{#if video_id}
	<div
		bind:this={slot_el}
		{@attach youtube_slot(show.number, true)}
		class="youtube-embed"
		data-testid="youtube-embed"
	>
		<!-- The page's largest picture, so it loads first. The button names it. -->
		<img
			src={get_thumbnail_from_id(video_id)}
			srcset={get_thumbnail_srcset_from_id(video_id)}
			sizes="(min-width: 1200px) 1136px, calc(100vw - 4rem)"
			width="1280"
			height="720"
			alt=""
			fetchpriority="high"
			decoding="async"
		/>
		<button
			type="button"
			onclick={handle_click}
			onpointerenter={prewarm}
			onfocus={prewarm}
			aria-label={label}
			title={label}
		>
			{#if is_docked_from_here}
				<span class="restore"><Icon name="expand" /></span>
			{:else}
				<span class="play"><Icon name="play" width={32} height={32} aria_hidden={true} /></span>
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

	img {
		width: 100%;
		height: 100%;

		/* YouTube's 640px picture is 4:3 with the frame letterboxed inside it */
		object-fit: cover;
	}

	button {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
	}

	span {
		display: grid;
		place-items: center;
		background: color-mix(in lch, var(--c-black), transparent 30%);
		color: var(--c-white);
	}

	.play {
		width: 5rem;
		height: 5rem;
		border-radius: 9999px;
		transition: scale 0.15s ease-out;
	}

	button:is(:hover, :focus-visible) .play {
		scale: 1.08;
	}

	.restore {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 8px;
		border-radius: var(--br-medium);
	}

	@media (prefers-reduced-motion: reduce) {
		.play {
			transition: none;
		}
	}
</style>
