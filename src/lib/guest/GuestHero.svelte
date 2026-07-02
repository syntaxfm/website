<script lang="ts">
	import Collage from '$lib/collage/Collage.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import { string_hash } from '$lib/utils/string_hash';

	interface Props {
		guest: {
			name: string;
			name_slug: string;
			of?: string | null;
			github?: string | null;
			twitter?: string | null;
			url?: string | null;
		};
	}

	let { guest }: Props = $props();

	// The name is a stacked display headline (one word per line), rendered twice: a
	// solid copy BEHIND the photo and an outline copy ON TOP of it. On the yellow the
	// solid shows through; where the letters cross the photo they read as an outline.
	const words = $derived(guest.name.trim().split(/\s+/));

	// A stable hash of the slug seeds a hand-placed tilt, so every portrait looks
	// individually pasted yet renders identically on server and client.
	const TILTS = ['-3deg', '-2deg', '2deg', '3deg', '-1.5deg'];
	const tilt = $derived(TILTS[string_hash(guest.name_slug) % TILTS.length]);

	const has_socials = $derived(Boolean(guest.twitter || guest.github || guest.url));
</script>

{#snippet nameLines()}
	{#each words as word, i (i)}
		<span class="name-line">{word}</span>
	{/each}
{/snippet}

<section class="guest-hero">
	<div class="band">
		<div class="stage">
			<h1 class="name name-solid fv-700-i">{@render nameLines()}</h1>

			<div class="portrait" style:--tilt={tilt}>
				<div class="layer collage-back" aria-hidden="true">
					<Collage seed={guest.name_slug} width={700} height={760} />
				</div>
				<div class="layer paper-mat" aria-hidden="true">
					<Collage
						seed={`${guest.name_slug}~mat`}
						width={640}
						height={700}
						solid="var(--c-white)"
					/>
				</div>
				<img
					class="portrait-photo"
					src={`https://github.com/${guest.github || 'null'}.png`}
					alt={guest.name}
					width="300"
					height="300"
				/>
			</div>

			<div class="name name-outline fv-700-i" aria-hidden="true">{@render nameLines()}</div>
		</div>
	</div>

	<div class="meta">
		{#if has_socials}
			<div class="socials">
				<HostSocialLink host={guest} />
			</div>
		{/if}
		<p class="full-name fv-700-i">{guest.name}</p>
		{#if guest.of}
			<p class="of">{guest.of}</p>
		{/if}
	</div>
</section>

<style lang="postcss">
	.guest-hero {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Full-bleed brand band — same convention as the newsletter banner. Forcing the
	   fg/bg tokens to black-on-white keeps children correct on the always-yellow
	   surface in either theme. */
	.band {
		--c-fg: var(--c-black);
		--c-bg: var(--c-white);

		position: relative;
		overflow: clip;
		width: 100vi;
		margin-inline: calc(50% - 50vi);
		padding-block: clamp(2.5rem, 6vw, 5rem);
		padding-inline: var(--pad-medium);
		background-color: var(--c-primary);
		background-image: var(--c-bg-grit-light);
		color: var(--c-black);
	}

	/* Name copies + portrait share one centred cell so the name sits behind (solid)
	   and in front (outline) of the photo. */
	.stage {
		position: relative;
		display: grid;
		place-items: center;
		max-width: 1200px;
		margin-inline: auto;
	}

	.stage > * {
		grid-area: 1 / 1;
	}

	.name {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
		font-size: clamp(4rem, 19vw, 15rem);
		line-height: 0.82;
		letter-spacing: -0.03em;
		text-align: center;
		pointer-events: none;
	}

	/* The readable layer: plain dark letters, behind the photo. */
	.name-solid {
		z-index: 0;
		color: var(--c-black);
	}

	/* A white-outline-only duplicate on top of the photo: where the letters cross the
	   photo they read as a white outline, and on the yellow it becomes the sticker halo. */
	.name-outline {
		z-index: 2;
		color: transparent;
		-webkit-text-stroke: 1px var(--c-white);
	}

	.portrait {
		z-index: 1;
		position: relative;
		width: clamp(190px, 32vw, 300px);
		rotate: var(--tilt, -2deg);
	}

	.layer {
		position: absolute;
	}

	/* Textured red/black collage scrap, offset behind the white photo mat. */
	.collage-back {
		inset: -18% -16%;
		z-index: 0;
		rotate: 5deg;
	}

	/* White torn-paper mat — larger than the photo so its ripped edges frame it. */
	.paper-mat {
		inset: -9% -8%;
		z-index: 1;
	}

	.portrait-photo {
		z-index: 2;
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		box-shadow: var(--s-graphic);
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}

	.socials {
		display: flex;
		gap: 18px;
	}

	.full-name {
		margin: 0;
		font-size: var(--fs-5);
	}

	.of {
		max-width: 60ch;
		margin: 0;
		font-size: var(--fs-4);
		color: var(--c-fg-7);
	}

	/* The name-behind-photo overlap only reads when the name is much wider than the
	   photo; at phone widths it isn't, so stack them (solid name above, photo below)
	   and drop the outline copy. */
	@media (--below-med) {
		.stage {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1.5rem;
		}

		.name {
			font-size: clamp(3rem, 15vw, 5rem);
			line-height: 0.9;
		}

		.name-outline {
			display: none;
		}

		.portrait {
			width: clamp(160px, 52vw, 240px);
		}
	}
</style>
