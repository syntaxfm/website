<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';
	import type { Attachment } from 'svelte/attachments';
	import Icon from '$lib/Icon.svelte';
	import Logo from '$lib/layout/Logo.svelte';
	import LiveTag from '$lib/tags/LiveTag.svelte';

	interface LiveStreamData {
		id: string;
		title: string;
		url: string;
		embed_url: string;
		started_at: string | null;
		labels: string[];
	}

	interface Props {
		stream: LiveStreamData | null;
		debug?: boolean;
	}

	const SYNTAX_STARTED_AT = 1499256000000;

	const debug_stream: LiveStreamData = {
		id: 'pMwTR2KeuaU',
		title: 'Bun re-written in Rust, Zig team big mad',
		url: 'https://www.youtube.com/watch?v=pMwTR2KeuaU',
		embed_url:
			'https://www.youtube-nocookie.com/embed/pMwTR2KeuaU?autoplay=1&mute=1&playsinline=1&rel=0&controls=1',
		started_at: '2026-07-14T15:00:00.000Z',
		labels: ['ai', 'github', 'conference']
	};

	const { stream, debug = false }: Props = $props();
	const title_id = $props.id();
	const displayed_stream = $derived(stream ?? (debug ? debug_stream : null));
	const embed_url = $derived.by(() => {
		if (!displayed_stream) return null;

		try {
			const url = new URL(displayed_stream.embed_url);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
			return url.toString();
		} catch {
			return null;
		}
	});
	const relative_start_time = $derived.by(() => {
		if (!displayed_stream?.started_at) return 'Live now';
		const started_at = new Date(displayed_stream.started_at);
		if (Number.isNaN(started_at.getTime())) return 'Live now';
		return formatDistanceToNow(started_at, { addSuffix: true });
	});
	const displayed_labels = $derived(
		displayed_stream ? [...new Set(displayed_stream.labels)].slice(0, 3) : []
	);
	let syntax_age_ms = $state(0);

	const track_syntax_age: Attachment<HTMLSpanElement> = () => {
		function update_syntax_age(): void {
			syntax_age_ms = Date.now() - SYNTAX_STARTED_AT;
		}

		update_syntax_age();
		const interval = window.setInterval(update_syntax_age, 500);
		return () => window.clearInterval(interval);
	};
</script>

{#if displayed_stream}
	<section class="live-stream" aria-labelledby={title_id}>
		<div class="hero-logo" aria-hidden="true"><Logo /></div>

		<div class="doodles" aria-hidden="true">
			<span class="doodle doodle-send">
				<Icon name="send" height="var(--doodle-size)" width="var(--doodle-size)" />
			</span>
			<span class="doodle doodle-cat">
				<Icon name="cat" height="var(--doodle-size)" width="var(--doodle-size)" />
			</span>
			<span class="doodle doodle-code">
				<Icon name="code" height="var(--doodle-size)" width="var(--doodle-size)" />
			</span>
			<span class="doodle doodle-devto">
				<Icon name="devto" height="var(--doodle-size)" width="var(--doodle-size)" />
			</span>
			<span class="doodle doodle-robot">
				<Icon name="robot" height="var(--doodle-size)" width="var(--doodle-size)" />
			</span>
		</div>
		<p class="developer-tagline">
			Empowering developers for over
			<span class="developer-count" {@attach track_syntax_age}>
				{syntax_age_ms.toLocaleString('en-US', { useGrouping: false })} milliseconds!
			</span>
		</p>

		<div class="video-stage">
			<div class="video-frame">
				{#key displayed_stream.id}
					{#if embed_url}
						<iframe
							src={embed_url}
							title="{displayed_stream.title} live stream"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerpolicy="strict-origin-when-cross-origin"
							allowfullscreen
						></iframe>
					{/if}
				{/key}
			</div>

			<div class="live-badge"><LiveTag /></div>
		</div>

		<a
			class="chat-callout"
			href={displayed_stream.url}
			target="_blank"
			rel="noopener noreferrer external"
		>
			<span>Join the live chat on YouTube now!</span>
			<Icon name="link-out" height="1.25em" width="1.25em" />
		</a>

		<div class="stream-details">
			<div class="stream-meta">
				<span class="meta-brand">Syntax Podcast</span>
				<span class="meta-x">x</span>
				<span class="meta-time">{relative_start_time}</span>
			</div>
			<h2 id={title_id}><span class="title-text">{displayed_stream.title}</span></h2>
			{#if displayed_labels.length}
				<div class="stream-labels">
					{#each displayed_labels as label (label)}
						<span>#{label}</span>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}

<style lang="postcss">
	.live-stream {
		--developer-tagline-font-size: var(--fs-4);
		--live-header-height: 165px;
		--live-hero-height: clamp(560px, calc(24vi + 344px), 680px);
		--live-badge-font-size: 24px;
		--stream-label-font-size: 24px;
		--stream-title-font-size: clamp(42px, calc(3.6vi + 9.6px), 60px);

		position: relative;
		isolation: isolate;
		overflow-x: clip;
		left: 50%;
		width: 100vi;
		height: calc(var(--live-header-height) + var(--live-hero-height));
		margin-top: calc(var(--live-header-height) * -1);
		translate: -50% 0;
		color: var(--c-white);
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
	}

	.live-stream::after {
		content: '';
		position: absolute;
		inset: auto 0 -1px;
		z-index: 0;
		height: clamp(48px, 13vi, 180px);
		background: color-mix(in srgb, var(--c-bg) 93%, var(--c-fg));
		clip-path: polygon(0 0, 100% 100%, 0 100%);
		pointer-events: none;
	}

	.hero-logo {
		position: absolute;
		top: clamp(45px, calc(2vi + 27px), 55px);
		left: clamp(40px, calc(12vi - 68px), 100px);
		z-index: 0;
		width: clamp(250px, calc(24vi + 34px), 370px);
		height: clamp(238px, calc(22.4vi + 36.4px), 350px);
		pointer-events: none;

		--logo-color: var(--c-primary);
	}

	.hero-logo :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.doodles {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.doodle {
		position: absolute;
		line-height: 0;
		color: var(--c-white);

		--doodle-size: 3em;
	}

	.doodle-send {
		top: 7%;
		left: 3.5%;
		rotate: 18deg;
	}

	.doodle-cat {
		top: 43%;
		right: 2.5%;
		rotate: -12deg;
		color: var(--c-white);
	}

	.doodle-code {
		bottom: 12%;
		left: 1%;
		rotate: 10deg;
	}

	.doodle-devto {
		right: 5%;
		bottom: 9%;
		rotate: -9deg;
	}

	.doodle-robot {
		right: 17%;
		bottom: 12%;
		rotate: -15deg;
		color: var(--c-white);
	}

	.developer-tagline {
		position: absolute;
		right: 3%;
		bottom: 5%;
		z-index: 2;
		width: 360px;
		margin: 0;
		color: var(--c-white);
		font-size: var(--developer-tagline-font-size);
		font-variation-settings: var(--fv-500-italic);
		letter-spacing: 3px;
		line-height: 1.55;
		text-align: right;
	}

	.developer-count {
		display: block;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.video-stage {
		position: absolute;
		top: calc(var(--live-header-height) + 10px);
		left: 50%;
		z-index: 1;
		isolation: isolate;
		width: clamp(620px, calc(63.6vi + 47.6px), 938px);
		translate: -50% 0;
	}

	.video-frame {
		box-sizing: border-box;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		padding: 0;
		background-color: var(--c-black);
		background-image: none;
		border: 10px solid var(--c-white);
		border-radius: 8px;
		box-shadow: none;
		filter: none;
	}

	.video-frame iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.live-badge {
		position: absolute;
		top: 24px;
		right: 24px;
		z-index: 2;
		transform: rotate(2deg);

		--live-tag-padding: 4px 8px;
		--live-tag-font-size: var(--live-badge-font-size);
		--live-tag-text-transform: none;
	}

	.chat-callout {
		position: absolute;
		top: calc(var(--live-header-height) + 195px);
		left: clamp(35px, 7vi, 98px);
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--pad-small);
		width: clamp(9.5rem, 14vw, 11.5rem);
		aspect-ratio: 1;
		padding: var(--pad-large);
		background-color: var(--c-primary);
		background-image: var(--c-bg-grit-light);
		clip-path: polygon(
			50% 0%,
			59% 12%,
			72% 4%,
			76% 19%,
			92% 15%,
			88% 31%,
			100% 40%,
			86% 50%,
			98% 62%,
			82% 68%,
			87% 85%,
			70% 81%,
			61% 98%,
			50% 85%,
			38% 100%,
			31% 83%,
			14% 89%,
			18% 71%,
			1% 63%,
			14% 51%,
			0% 40%,
			16% 32%,
			9% 16%,
			27% 20%,
			31% 3%,
			42% 14%
		);
		color: var(--c-black);
		font-size: var(--fs-2);
		font-variation-settings: var(--fv-800-italic);
		line-height: 1.25;
		text-align: center;
		text-decoration: none;
		filter: drop-shadow(-4px 4px 0 var(--c-black));
		rotate: -7deg;
		transition: transform 120ms ease;
	}

	.chat-callout::after {
		content: none;
	}

	.chat-callout:hover {
		transform: rotate(2deg) scale(1.03);
	}

	.chat-callout:active {
		transform: scale(0.97);
	}

	.chat-callout:focus-visible {
		outline: var(--b-medium);
		outline-color: var(--c-teal);
		outline-offset: var(--pad-small);
	}

	.stream-details {
		position: absolute;
		top: calc(var(--live-header-height) + clamp(260px, calc(10vi + 170px), 310px));
		left: 50%;
		z-index: 3;
		width: clamp(580px, calc(50.4vi + 126.4px), 832px);
		translate: -50% 0;
	}

	.stream-meta,
	.stream-labels {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--pad-small);
	}

	.stream-meta {
		position: relative;
		z-index: 2;
		flex-wrap: nowrap;
		gap: 4px;
		width: fit-content;
		margin-bottom: 6px;
		transform: rotate(-4.86deg);
		transform-origin: left center;

		--stream-meta-font-size: 24px;
	}

	.stream-meta span,
	.stream-labels span {
		padding: 4px 8px;
		background-color: var(--c-white);
		background-image: var(--c-bg-grit-light);
		border-radius: var(--br-small);
		box-shadow: none;
		color: var(--c-black);
		font-size: var(--stream-label-font-size);
		font-variation-settings: var(--fv-700);
		line-height: 1.2;

		--c-fg: var(--c-black);
	}

	.stream-meta span {
		padding: 4px 8px;
		background-size: 926px 694px;
		border-radius: 4px;
		box-shadow: none;
		font-size: var(--stream-meta-font-size);
		font-variation-settings: var(--fv-600);
		line-height: normal;
		/* stylelint-disable alpha-value-notation -- Preserve the exact Figma shadow values. */
		filter: drop-shadow(0 4px 4px rgb(0 0 0 / 15%)) drop-shadow(0 1px 1.5px rgb(0 0 0 / 30%));
		/* stylelint-enable alpha-value-notation */
	}

	.stream-meta .meta-brand {
		background-color: var(--c-primary);
	}

	.stream-meta .meta-time {
		background-color: var(--c-primary);
	}

	.stream-meta .meta-x {
		background-color: var(--c-black);
		color: var(--c-primary);
		font-variation-settings: var(--fv-600);
	}

	.stream-labels {
		width: fit-content;
		margin-top: var(--pad-medium);
		transform: rotate(-3deg);
		transform-origin: left center;
	}

	.stream-labels span {
		background-color: var(--c-primary);
		/* stylelint-disable alpha-value-notation -- Preserve the exact Figma shadow values. */
		filter: drop-shadow(0 4px 4px rgb(0 0 0 / 15%)) drop-shadow(0 1px 1.5px rgb(0 0 0 / 30%));
		/* stylelint-enable alpha-value-notation */
	}

	h2 {
		width: 100%;
		margin: 0;
		font-size: var(--stream-title-font-size);
		font-variation-settings: var(--fv-900-italic);
		line-height: 1.05;
		transform: rotate(-10.14deg);
		transform-origin: left center;
	}

	.title-text {
		padding: 0.05em 0.15em;
		background: var(--c-primary);
		box-decoration-break: clone;
		color: var(--c-black);
	}

	@media (--below-large) and (--above-med) {
		.live-stream {
			--stream-title-font-size: 42px;
		}

		.video-stage {
			top: calc(var(--live-header-height) + 32px);
			width: calc(100vi - 80px);
		}

		.stream-details {
			top: calc(var(--live-header-height) + 315px);
			width: 72vi;
		}

		.chat-callout,
		.developer-tagline {
			display: none;
		}
	}

	@media (--above-xlarge) {
		.chat-callout {
			top: 440px;
			left: -525px;
			visibility: hidden;
			width: 447px;
		}

		.stream-details {
			top: 656px;
			transform: rotate(-10.14deg);
			transform-origin: left top;
		}

		.stream-meta {
			position: absolute;
			top: -123px;
			left: -18px;
			transform: rotate(5.28deg);
		}

		h2 {
			transform: none;
		}

		.stream-labels {
			transform: rotate(7.14deg);
		}

		.developer-tagline {
			inset: 758px auto auto 871px;
			width: 386px;
			font-size: var(--fs-3);
			line-height: 1.7;
		}

		.doodle {
			--doodle-size: 48px;
		}

		.doodle-send {
			top: 87px;
			left: 480px;
			rotate: 0deg;
		}

		.doodle-cat {
			top: 590px;
			right: 26px;
			rotate: 15deg;
		}

		.doodle-code {
			top: 723px;
			bottom: auto;
			left: 37px;
			rotate: -15deg;
		}

		.doodle-devto {
			top: 780px;
			right: 71px;
			bottom: auto;
			rotate: -15deg;
		}

		.doodle-robot {
			top: 710px;
			right: 315px;
			bottom: auto;
			rotate: -15deg;
		}
	}

	@media (--below-med) {
		.live-stream {
			--developer-tagline-font-size: 16px;
			--live-header-height: 323px;
			--live-hero-height: 460px;
			--live-badge-font-size: 16px;
			--stream-label-font-size: 8.84px;
			--stream-title-font-size: 23.562px;

			background-size:
				67px 67px,
				1000px 2000px,
				180% 110%,
				170% 110%;
		}

		.live-stream::after {
			height: 40px;
		}

		.hero-logo {
			top: 88px;
			left: 50%;
			width: 200px;
			height: 189.387px;
			translate: -50% 0;
		}

		.hero-logo :global(svg) {
			width: 100%;
			height: 100%;
		}

		.video-stage {
			top: var(--live-header-height);
			width: calc(100vi - 40px);
		}

		.video-frame {
			border-width: 4px;
		}

		.live-badge {
			top: 8px;
			right: 8px;
			transform: none;
		}

		.stream-details {
			top: 490px;
			width: 306px;
		}

		.developer-count {
			white-space: normal;
		}

		.stream-meta {
			gap: 1.473px;
			min-height: 18px;
			margin-bottom: 8px;

			--stream-meta-font-size: 8.84px;
		}

		.stream-meta span {
			padding: 1.473px 2.945px;
			/* stylelint-disable alpha-value-notation -- Preserve the exact Figma shadow values. */
			filter: drop-shadow(0 1.473px 1.473px rgb(0 0 0 / 15%))
				drop-shadow(0 0.368px 0.552px rgb(0 0 0 / 30%));
			/* stylelint-enable alpha-value-notation */
		}

		.stream-labels {
			gap: 2.945px;
			margin-top: 5.891px;
		}

		.stream-labels span {
			padding: 1.473px 2.945px;
			/* stylelint-disable alpha-value-notation -- Preserve the exact Figma shadow values. */
			filter: drop-shadow(0 1.473px 1.473px rgb(0 0 0 / 15%))
				drop-shadow(0 0.368px 0.552px rgb(0 0 0 / 30%));
			/* stylelint-enable alpha-value-notation */
		}

		h2 {
			line-height: normal;
		}

		.chat-callout {
			display: none;
		}

		.doodle {
			--doodle-size: 24px;
		}

		.doodle-send {
			top: 274px;
			left: 42px;
		}

		.doodle-cat {
			top: 522px;
			right: -2px;
		}

		.doodle-code {
			bottom: auto;
			top: 576px;
			left: 3px;
		}

		.doodle-devto {
			top: 590px;
			right: 37px;
			bottom: auto;
		}

		.doodle-robot {
			top: 579px;
			right: 127px;
			bottom: auto;
		}

		.developer-tagline {
			top: 667px;
			right: 16px;
			bottom: auto;
			width: 265px;
			line-height: 1.81;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chat-callout {
			transition: none;
		}
	}
</style>
