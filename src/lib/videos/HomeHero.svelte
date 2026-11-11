<script lang="ts">
	import Icon from '#lib/Icon.svelte';
	import Logo from '#lib/layout/Logo.svelte';
	import LiveTag from '#lib/tags/LiveTag.svelte';
	import { player } from '$state/player';
	import type { PlayerShow } from '$state/player_utils';
	import { youtube_player } from '$state/youtube_player';
	import VideoPoster from './VideoPoster.svelte';
	import YoutubeEmbed from './YoutubeEmbed.svelte';
	import { get_autoplay_embed_url_from_id } from './utils';

	// Home's hero. While Syntax is live it plays the stream. The rest of the time it holds the
	// channel's newest video, which waits for a click.
	interface HeroVideo {
		id: string;
		title: string;
		is_live: boolean;
	}

	interface Props {
		video: HeroVideo | null;
		// The episode the video belongs to, if it's one: it then plays in the site's player
		show?: PlayerShow | null;
		// Development: shows the hero as it looks during a live stream
		debug?: boolean;
	}

	const POSTER_SIZES = '(min-width: 1400px) 938px, (min-width: 900px) 68vw, calc(100vw - 48px)';

	const debug_video: HeroVideo = {
		id: 'pMwTR2KeuaU',
		title: 'Bun re-written in Rust, Zig team big mad',
		is_live: true
	};

	const { video, show = null, debug = false }: Props = $props();
	const title_id = $props.id();
	const displayed_video = $derived(debug ? debug_video : video);
	const is_live = $derived(Boolean(displayed_video?.is_live));

	// A video that isn't an episode plays here in YouTube's own player, once asked for. The id, so
	// a different video arriving starts as a picture again.
	let playing_here_id: string | null = $state(null);
	const is_embedded = $derived(is_live || playing_here_id === displayed_video?.id);
	// An episode plays in the site's player, which is laid over the frame
	const is_episode_playing_here = $derived(
		show !== null &&
			$youtube_player.status !== 'IDLE' &&
			$youtube_player.target === 'SLOT' &&
			$youtube_player.active_show?.number === show.number
	);
	// The title leans over the picture, and gets out of the way of a video that's playing
	const is_playing = $derived(is_embedded || is_episode_playing_here);

	function play_here() {
		if (!displayed_video) return;
		if ($player.status === 'PLAYING') player.pause();
		playing_here_id = displayed_video.id;
	}

	// One thing plays at a time: the site's player starting puts this back to its picture. Playing
	// is a status in the player's store, so there's no event to hang this on.
	$effect(() => {
		if ($player.status === 'PLAYING') playing_here_id = null;
	});
</script>

<!--
	Every part sits in a grid area, so parts can't land on each other whatever the title or the
	width. The icons share an area with the part they sit beside and keep to its empty corners.
-->
{#if displayed_video}
	<section class={['home-hero', { 'is-playing': is_playing }]} aria-labelledby={title_id}>
		<div class="logo" aria-hidden="true"><Logo /></div>

		<div class="video-frame">
			{#if is_embedded}
				{#key displayed_video.id}
					<!-- A stream starts by itself, so it has to start muted -->
					<iframe
						src={get_autoplay_embed_url_from_id(displayed_video.id, { muted: is_live })}
						title={is_live ? `${displayed_video.title} live stream` : displayed_video.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						allowfullscreen
					></iframe>
				{/key}
			{:else if show}
				<YoutubeEmbed {show} is_show_page={false} sizes={POSTER_SIZES} />
			{:else}
				<VideoPoster
					video_id={displayed_video.id}
					label={`Play ${displayed_video.title}`}
					sizes={POSTER_SIZES}
					onplay={play_here}
				/>
			{/if}
		</div>

		{#if is_live}
			<div class="live-badge"><LiveTag /></div>
		{/if}

		<h2 id={title_id}><span>{displayed_video.title}</span></h2>

		<!-- These icons are drawn as outlines already, so they take no extra stroke -->
		<span class="doodle doodle-send" aria-hidden="true">
			<Icon name="send" height="100%" width="100%" weight={0} />
		</span>
		<span class="doodle doodle-cat" aria-hidden="true">
			<Icon name="cat" height="100%" width="100%" weight={0} />
		</span>
		<span class="doodle doodle-code" aria-hidden="true">
			<Icon name="code" height="100%" width="100%" weight={1.25} />
		</span>
		<span class="doodle doodle-robot" aria-hidden="true">
			<Icon name="robot" height="100%" width="100%" weight={0} />
		</span>
		<span class="doodle doodle-devto" aria-hidden="true">
			<Icon name="devto" height="100%" width="100%" weight={0} />
		</span>
	</section>
{/if}

<style lang="postcss">
	.home-hero {
		/* Header.svelte's height on Home. The hero runs up behind it. */
		--header-height: 165px;
		--logo-top: 48px;
		--logo-width: clamp(200px, 22vi, 340px);

		/* How much of the logo's right side the video covers: its full stop, and none of the "x" */
		--logo-tuck: calc(var(--logo-width) * 0.115);

		/* Below the header's nav */
		--video-top: calc(var(--header-height) + 10px);
		--gutter: clamp(24px, 3vi, 48px);
		--wedge-height: clamp(48px, 13vi, 180px);
		--frame-border: 10px;
		--title-size: clamp(42px, calc(3.6vi + 9.6px), 60px);
		--title-gap: clamp(14px, 3vi, 37px);
		--doodle-size: 48px;

		/* How far each part drifts as the page scrolls is its own --drift, times this */
		--drift-scale: 1;

		/* A soft spring: settles 2% past the end, then back */
		--title-ease: linear(
			0,
			0.006,
			0.025 2.8%,
			0.101 6.1%,
			0.539 18.9%,
			0.721 25.3%,
			0.849 31.5%,
			0.937 38.1%,
			0.968 41.8%,
			0.991 45.7%,
			1.006 50.1%,
			1.015 55%,
			1.017 63.9%,
			1.001
		);

		position: relative;
		isolation: isolate;
		overflow-x: clip;
		left: 50%;
		display: grid;

		/*
			The video sits in the middle when there's room, and the logo tucks its right edge in
			behind it. On a narrower screen the logo's column holds its width and the video gives way.
		*/
		grid-template:
			[logo-start video-start] auto
			[logo-end icons-start] 1fr
			[icons-end video-end title-start] minmax(var(--wedge-height), auto)
			[title-end]
			/ [logo-start icons-start] minmax(calc(var(--logo-width) - var(--logo-tuck)), 1fr)
			[icons-end video-start title-start] var(--logo-tuck)
			[logo-end] minmax(0, calc(938px - var(--logo-tuck)))
			[video-end title-end] minmax(0, 1fr);
		width: 100vi;
		margin-top: calc(var(--header-height) * -1);
		padding: var(--logo-top) var(--gutter) var(--pad-xlarge);
		translate: -50% 0;
		color: var(--c-white);
	}

	/*
		The dark surface. Its bottom edge is cut on a slant, so whatever the page is made of shows
		through under it.
	*/
	.home-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background-color: var(--c-black);
		background-image:
			radial-gradient(circle, oklch(from var(--c-white) l c h / 0.17) 0 1px, transparent 1.5px),
			var(--c-bg-grit-dark),
			radial-gradient(
				farthest-side circle at 0% 25%,
				oklch(from var(--c-purple) l c h / 0.82),
				transparent 72%
			),
			radial-gradient(
				farthest-side circle at 100% 52%,
				oklch(from var(--c-yellow) 26% 0.09 55deg / 0.62),
				transparent 70%
			);
		background-repeat: repeat, repeat, no-repeat, no-repeat;
		background-position:
			17px 11px,
			center,
			left center,
			right center;
		background-size:
			83px 83px,
			1000px 2000px,
			62% 130%,
			58% 130%;
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - var(--wedge-height)));
	}

	.logo {
		grid-area: logo;
		justify-self: end;
		width: var(--logo-width);
		aspect-ratio: 1371 / 1212;

		/* "Syn" clears the video's top edge. Only the end of "tax." goes behind it. */
		margin-top: calc(var(--video-top) - var(--logo-top) - var(--logo-width) * 1212 / 1371 * 0.5);

		--logo-color: var(--c-primary);

		/* Furthest back, so it falls behind the most */
		--drift: 140px;

		:global(svg) {
			display: block;
			width: 100%;
			height: 100%;
		}
	}

	.video-frame {
		position: relative;
		grid-area: video;
		align-self: start;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		margin-top: calc(var(--video-top) - var(--logo-top));
		background: var(--c-black);
		border: var(--frame-border) solid var(--c-white);
		border-radius: var(--br-medium);

		/* Lifted off the surface, and off the logo behind it */
		box-shadow:
			0 2px 6px oklch(from var(--c-black) l c h / 0.5),
			0 32px 64px -24px oklch(from var(--c-black) l c h / 0.9);

		/* An episode's embed fills the frame, square inside the frame's own rounded border */
		--embed-radius: 0;

		:global(.youtube-embed) {
			height: 100%;
			aspect-ratio: auto;
		}

		iframe {
			display: block;
			width: 100%;
			height: 100%;
			border: 0;
		}
	}

	/* Hangs off the frame's top edge, clear of YouTube's own buttons in that corner */
	.live-badge {
		grid-area: video;
		place-self: start end;
		z-index: 1;
		margin-top: calc(var(--video-top) - var(--logo-top));
		pointer-events: none;
		translate: 14px -65%;
		rotate: 2deg;

		--live-tag-padding: 4px 8px;
		--live-tag-font-size: var(--fs-5);
		--live-tag-text-transform: none;
	}

	/*
		The title's place is under the video. Until the video plays it's lifted to lean over the
		picture's bottom edge. Only moved with translate and rotate, so nothing else shifts.
	*/
	h2 {
		grid-area: title;
		place-self: start start;
		z-index: 1;

		/* Three lines holds most titles whole. Monday's stream titles run to four or more. */
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;

		/* The rest of the row is the icons' */
		max-width: 76%;
		margin: var(--title-gap) 0 0 3%;

		/* The dots that end a cut-off title are drawn in this color, outside the yellow */
		color: var(--c-primary);
		font-size: var(--title-size);
		font-variation-settings: var(--fv-900-italic);
		line-height: 1.05;
		text-wrap: balance;

		/* Sits a little above the picture */
		filter: drop-shadow(0 10px 14px oklch(from var(--c-black) l c h / 0.45));

		/* A click on the title is a click on the picture under it */
		pointer-events: none;
		transform-origin: left top;
		translate: 0 calc(-1 * (var(--title-gap) + 0.75em));
		rotate: -10.14deg;
		transition:
			translate 600ms var(--title-ease),
			rotate 600ms var(--title-ease);

		span {
			padding: 0.05em 0.15em;
			background: var(--c-primary);
			box-decoration-break: clone;
			color: var(--c-black);
		}
	}

	.is-playing h2 {
		translate: 0 0;
		rotate: -2deg;
	}

	.doodle {
		z-index: 1;
		width: var(--doodle-size);
		height: var(--doodle-size);
		line-height: 0;
		pointer-events: none;
	}

	/* Above the frame's top edge, between the logo and the nav */
	.doodle-send {
		grid-area: video;
		place-self: start start;
		margin: calc(var(--header-height) - var(--logo-top) - var(--doodle-size)) 0 0
			calc(var(--logo-tuck) + var(--pad-medium));
		rotate: 8deg;

		--drift: -40px;
	}

	/* Under the logo, measured from the video's edge so they stay with the logo on a wide screen */
	.doodle-code {
		grid-area: icons;
		place-self: end end;
		margin-right: calc(var(--logo-width) * 0.62);
		rotate: -15deg;

		--drift: -55px;
	}

	.doodle-cat {
		grid-area: icons;
		place-self: center end;
		margin-right: var(--gutter);
		rotate: 15deg;

		--drift: -30px;
	}

	/* Right of the title */
	.doodle-robot {
		grid-area: title;
		place-self: start end;
		margin: var(--title-gap) 10% 0 0;
		rotate: -15deg;

		--drift: 25px;
	}

	.doodle-devto {
		grid-area: title;
		place-self: end end;
		rotate: -9deg;

		--drift: -20px;
	}

	/*
		Depth. As the page scrolls, the logo falls behind the video and each icon runs at its own
		pace. The video and its title stay put.
	*/
	@keyframes drift {
		to {
			translate: 0 calc(var(--drift) * var(--drift-scale));
		}
	}

	@supports (animation-timeline: scroll()) {
		@media (prefers-reduced-motion: no-preference) {
			.logo,
			.doodle {
				animation: drift linear both;
				animation-timeline: scroll(root);
				animation-range: 0 100lvh;
			}
		}
	}

	@media (--below-xlarge) {
		.home-hero {
			--doodle-size: 40px;
		}
	}

	/* The video takes the full width, under the logo */
	@media (--below-large) {
		.home-hero {
			/* Below the header's nav */
			--logo-top: 96px;
			--logo-width: clamp(180px, 28vi, 240px);

			grid-template:
				'logo  icons' auto
				'video video' auto
				'title title' minmax(var(--wedge-height), auto)
				/ var(--logo-width) minmax(0, 1fr);
			column-gap: var(--gutter);
		}

		.logo {
			margin-top: 0;
		}

		.video-frame,
		.live-badge {
			margin-top: var(--gutter);
		}

		.doodle-send {
			grid-area: icons;
			margin: 0;
		}

		.doodle-code {
			justify-self: center;
			margin-right: 0;
		}

		.doodle-cat {
			margin-right: 0;
		}
	}

	/* One column, the icons either side of the logo */
	@media (--below-med) {
		.home-hero {
			--header-height: 323px;
			--logo-top: 88px;
			--logo-width: 200px;
			--gutter: 20px;
			--frame-border: 4px;
			--title-size: var(--fs-5);
			--doodle-size: 24px;
			--drift-scale: 0.5;

			grid-template:
				'logo' auto
				'video' auto
				'title' auto
				/ minmax(0, 1fr);
			padding-bottom: var(--wedge-height);
		}

		.home-hero::before {
			background-size:
				67px 67px,
				1000px 2000px,
				180% 110%,
				170% 110%;
		}

		.logo {
			justify-self: center;
		}

		.video-frame,
		.live-badge {
			margin-top: calc(var(--header-height) - var(--logo-top) - var(--logo-width) * 1212 / 1371);
		}

		.live-badge {
			--live-tag-font-size: var(--fs-3);
		}

		.doodle-send {
			grid-area: logo;
			align-self: center;
		}

		.doodle-cat {
			grid-area: logo;
			align-self: start;
		}

		.doodle-code {
			grid-area: logo;
			justify-self: end;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		h2 {
			transition: none;
		}
	}
</style>
