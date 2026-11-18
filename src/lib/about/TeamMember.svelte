<script lang="ts">
	import type { Snippet } from 'svelte';
	import Collage from '#lib/collage/Collage.svelte';
	import type { CollagePalette } from '#lib/collage/collage.ts';
	import HostSocialLink from '#lib/hosts/HostSocialLink.svelte';
	import { string_hash } from '#lib/utils/string_hash.ts';
	import halftone_splat from '$assets/about/halftone-splat.webp';

	interface Props {
		first_name: string;
		last_name: string;
		/** A head cut out of the headshot (scripts/face_cutout.swift). */
		face: string;
		/** The embarrassing old photo that swaps in on hover. */
		throwback?: string;
		github?: string;
		twitter?: string;
		children: Snippet;
	}

	let { first_name, last_name, face, throwback, github, twitter, children }: Props = $props();

	// Red-led, like the magazine scraps in the design, rather than the default black-led mix.
	const BAND_PALETTE: CollagePalette = {
		paper: '#ff474e',
		ink: '#1a1a1a',
		accent: '#f4f1ec',
		scratch: '#ffffff'
	};

	const name = $derived(`${first_name} ${last_name}`);

	// A stable hash of the name picks each member's turn of the splat, collage and photo,
	// so the cards look hand-pasted but render the same on server and client.
	const seed = $derived(string_hash(name));
	const SPLAT_TURNS = ['-105deg', '-135deg', '0deg', '160deg', '-30deg', '75deg'];
	const BAND_TILTS = ['-6deg', '4deg', '-3deg', '7deg', '-8deg'];
	const splat_turn = $derived(SPLAT_TURNS[seed % SPLAT_TURNS.length]);
	const band_tilt = $derived(BAND_TILTS[seed % BAND_TILTS.length]);
</script>

<article class="member" style:--splat-turn={splat_turn} style:--band-tilt={band_tilt}>
	<div class="band" aria-hidden="true">
		<Collage seed={name} width={720} height={200} palette={BAND_PALETTE} />
	</div>

	<div class="portrait">
		<img class="splat" src={halftone_splat} alt="" aria-hidden="true" />
		<img class="face" src={face} alt={name} />
		{#if throwback}
			<img class="throwback" src={throwback} alt="" aria-hidden="true" loading="lazy" />
		{/if}
	</div>

	<div class="card graphic-card">
		<h2 class="name">
			<span class="first-name fv-700-i">{first_name}</span>
			<span class="last-name">{last_name}</span>
		</h2>
		<p class="bio">{@render children()}</p>
		{#if github || twitter}
			<p class="socials">
				<HostSocialLink host={{ name, github, twitter }} />
			</p>
		{/if}
	</div>
</article>

<style lang="postcss">
	.member {
		--face-width: clamp(140px, 38%, 200px);

		position: relative;
		display: grid;
		isolation: isolate;
	}

	/* Torn red collage strip behind the top of the card, running past its far edge. */
	.band {
		position: absolute;
		z-index: -1;
		inset-block-start: calc(var(--face-width) * 0.15);
		inset-inline: -8% -14%;
		height: calc(var(--face-width) * 0.8);
		rotate: var(--band-tilt, -4deg);
	}

	/* The head sits over the card's top edge, right of the name. */
	.portrait {
		position: relative;
		z-index: 2;
		justify-self: end;
		width: var(--face-width);
		margin-inline-end: 14%;
		margin-block-end: calc(var(--face-width) * -0.42);
	}

	.splat {
		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 50%;
		width: 150%;
		max-width: none;
		height: auto;
		translate: -50% -50%;
		rotate: var(--splat-turn, 0deg);
		pointer-events: none;
	}

	/* Grayscale cutout on a white paper edge, like it was snipped out of a magazine. */
	.face,
	.throwback {
		position: relative;
		display: block;
		width: 100%;
		height: auto;
	}

	.face {
		filter: grayscale(1) contrast(1.12) drop-shadow(1.5px 0 0 var(--c-white))
			drop-shadow(-1.5px 0 0 var(--c-white)) drop-shadow(0 1.5px 0 var(--c-white))
			drop-shadow(-5px 4px 0 var(--c-white)) drop-shadow(-4px 6px 6px rgb(0 0 0 / 0.25));
		transition: opacity 0.15s;
	}

	/* The old photo, as a tilted snapshot in the same spot. */
	.throwback {
		position: absolute;
		inset-block-start: 6%;
		inset-inline-start: 0;
		aspect-ratio: 1;
		object-fit: cover;
		border: 6px solid var(--c-white);
		box-shadow: var(--s-graphic);
		rotate: -6deg;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.portrait:hover {
		.face {
			opacity: 0;
		}

		.throwback {
			opacity: 1;
		}
	}

	.card {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 0.375rem;
		padding: 0.75rem 1.125rem 1rem;
		background-image: var(--c-bg-grit, none);
	}

	.name {
		display: grid;
		margin: 0;
	}

	.first-name {
		font-size: var(--fs-7);
		line-height: 1.4;
	}

	.last-name {
		font-size: var(--fs-5);
		font-variation-settings: var(--fv-400);
		line-height: 1.4;
	}

	.bio {
		margin: 0;
		font-size: var(--fs-3);
		line-height: 1.7;
	}

	.socials {
		display: flex;
		gap: 1rem;
		margin: 0;
	}

	/* On a phone-wide card a long first name reaches the face, so the face sits in the
	   corner and dips less into the card. */
	@media (--below-med) {
		.member {
			--face-width: 124px;
		}

		.portrait {
			margin-inline-end: 0.5rem;
			margin-block-end: calc(var(--face-width) * -0.22);
		}
	}
</style>
