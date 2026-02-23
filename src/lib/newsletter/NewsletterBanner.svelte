<script lang="ts">
	import NewsletterForm from './NewsletterForm.svelte';
	import NewsletterLogo from './NewsletterLogo.svelte';
	const { count }: { count: string } = $props();
</script>

<div class="newsletter-banner">
	<div class="newsletter-banner-inner">
		<div class="banner-logo-wrap">
			<NewsletterLogo />
		</div>
		<p class="banner-copy center">
			Be one of the <strong>{count}</strong> coolest people in the world!
		</p>
		<NewsletterForm show_logo={false} variant="snackpack_hero" />
		<p class="banner-supporting center">
			Get hot takes, tips & tricks, new content, swag drops & more
		</p>
	</div>
</div>

<style lang="postcss">
	.newsletter-banner {
		background-color: var(--c-primary);
		background-image: var(--c-bg-grit-light);
		width: 100vi;
		margin-inline: calc(50% - 50vi);
		padding: clamp(2rem, 5vw, 4rem) var(--pad-medium) clamp(2rem, 4vw, 3.5rem);
		color: var(--c-black);
	}

	.newsletter-banner-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		justify-items: center;
		gap: clamp(0.6rem, 1.6vw, 1.1rem);
	}

	.banner-logo-wrap {
		width: min(92vw, 880px);

		:global(img) {
			display: block;
			width: 100%;
			height: auto;
		}
	}

	.banner-copy {
		margin: clamp(0.3rem, 1vw, 0.6rem) 0 0;
		max-width: 24ch;
		text-align: center;
		font-size: clamp(var(--fs-4), 2.3vw, var(--fs-6));
		line-height: 1.35;
		font-variation-settings: var(--fv-500);
		color: var(--c-black);
	}

	.banner-copy strong {
		font-variation-settings: var(--fv-900);
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
