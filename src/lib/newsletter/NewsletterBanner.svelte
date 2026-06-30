<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Collage from '$lib/collage/Collage.svelte';
	import NewsletterForm from './NewsletterForm.svelte';
	import NewsletterLogo from './NewsletterLogo.svelte';
	const { count }: { count: string } = $props();

	const DOODLE_SIZE = 44;
</script>

<div class="newsletter-banner">
	<div class="banner-doodles" aria-hidden="true">
		<span class="doodle doodle-coffee"
			><Icon name="coffee" height={DOODLE_SIZE} width={DOODLE_SIZE} /></span
		>
		<span class="doodle doodle-devto"
			><Icon name="devto" height={DOODLE_SIZE} width={DOODLE_SIZE} /></span
		>
		<span class="doodle doodle-plane"
			><Icon name="send" height={DOODLE_SIZE} width={DOODLE_SIZE} /></span
		>
		<span class="doodle doodle-robot"
			><Icon name="robot" height={DOODLE_SIZE} width={DOODLE_SIZE} /></span
		>
	</div>
	<div class="newsletter-banner-inner">
		<div class="banner-hero">
			<div class="banner-logo-wrap">
				<NewsletterLogo />
			</div>
			<p class="banner-copy">
				Be one of the <strong>{count}</strong> coolest people in the world!
			</p>
		</div>
		<div class="signup">
			<div class="signup-paper" aria-hidden="true">
				<Collage seed="signup-paper-backing" width={1100} height={200} solid="var(--c-black)" />
			</div>
			<div class="signup-collage" aria-hidden="true">
				<Collage seed="syntax-newsletter-signup" width={1100} height={200} />
			</div>
			<NewsletterForm show_logo={false} variant="snackpack_hero" />
		</div>
		<p class="banner-supporting center">
			Get hot takes, tips & tricks, new content, swag drops & more
		</p>
	</div>
</div>

<style lang="postcss">
	.newsletter-banner {
		container: newsletter-banner / inline-size;
		position: relative;
		overflow: clip;
		background-color: var(--c-primary);
		background-image: var(--c-bg-grit-light);
		width: 100vi;
		margin-inline: calc(50% - 50vi);
		padding: clamp(2rem, 5vw, 4rem) var(--pad-medium) clamp(2rem, 4vw, 3.5rem);
		color: var(--c-black);
	}

	/* Decorative doodles scattered in the band's gutters, mirroring the Figma collage. */
	.banner-doodles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.doodle {
		position: absolute;
		line-height: 0;
		color: var(--c-black);
	}

	.doodle-coffee {
		top: 9%;
		left: 4%;
		rotate: -15deg;
	}

	.doodle-devto {
		top: 14%;
		right: 6%;
		rotate: 12deg;
	}

	.doodle-plane {
		top: 56%;
		right: 4%;
		rotate: 8deg;
	}

	.doodle-robot {
		bottom: 8%;
		left: 6%;
		rotate: -12deg;
	}

	.newsletter-banner-inner {
		position: relative;
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		justify-items: center;
		gap: clamp(0.6rem, 1.6vw, 1.1rem);
	}

	/* No room for the doodles once the content fills the band — drop them. */
	@container newsletter-banner (width < 1150px) {
		.banner-doodles {
			display: none;
		}
	}

	/* Logo + count form one collage group; the count tucks into the logo's
	   lower-right negative space (under the "Snack Pack" tag, right of the box). */
	.banner-hero {
		position: relative;
		width: min(92vw, 880px);
	}

	.banner-logo-wrap {
		width: 100%;

		:global(img) {
			display: block;
			width: 100%;
			height: auto;
		}
	}

	/* The signup form sits on a torn collage strip (always a backing layer). */
	.signup {
		position: relative;
		width: min(96vw, 1000px);
		margin-block: clamp(0.4rem, 1.5vw, 1rem);
	}

	/* Mismatched solid --fg paper layered behind the collage for offset depth. */
	.signup-paper {
		position: absolute;
		inset: -20px -24px;
		z-index: 0;
		rotate: 2deg;
		translate: -8px 9px;
	}

	.signup-collage {
		position: absolute;
		inset: -18px -22px;
		z-index: 1;
		rotate: -1.5deg;
	}

	.signup > :global(.newsletter-layout) {
		position: relative;
		z-index: 2;
	}

	.banner-copy {
		position: absolute;
		right: clamp(0px, 2vw, 28px);
		bottom: clamp(6px, 2.2vw, 40px);
		width: min(48%, 340px);
		margin: 0;
		text-align: left;
		font-size: clamp(var(--fs-3), 1.4vw, var(--fs-4));
		line-height: 1.4;
		font-variation-settings: var(--fv-400);
		color: var(--c-black);
	}

	.banner-copy strong {
		font-size: 1.45em;
		font-variation-settings: var(--fv-700-italic);
	}

	/* No room to overlap on smaller screens — drop the count below the logo. */
	@media (--below-large) {
		.banner-copy {
			position: static;
			width: auto;
			max-width: 30ch;
			margin: 1rem auto 0;
		}
	}

	.banner-supporting {
		margin: clamp(1.2rem, 2.6vw, 2rem) 0 0;
		max-width: 40ch;
		text-align: center;
		font-size: clamp(var(--fs-3), 1.8vw, var(--fs-4));
		line-height: 1.45;
		font-variation-settings: var(--fv-400);
		color: var(--c-black);
	}

	@media (--below-med) {
		.newsletter-banner {
			padding-inline: var(--pad-small);
		}

		.banner-copy {
			max-width: 22ch;
		}

		.banner-supporting {
			max-width: 30ch;
		}
	}
</style>
