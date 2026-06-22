<script lang="ts">
	import swag from './swag.png';

	const HEADLINE = 'Join our newsletter for 15% off all Syntax & Sentry swag!';
</script>

<section class="newsletter-promo" style:--swag="url({swag})">
	<p class="promo-headline fv-700-i">{HEADLINE}</p>
</section>

<style lang="postcss">
	.newsletter-promo {
		container: newsletter-promo / inline-size;
		width: 100vi;
		margin-inline: calc(50% - 50vi);
		min-height: clamp(220px, 33vw, 460px);
		display: grid;
		place-items: center;
		padding: var(--pad-large) var(--pad-medium);
		background: var(--swag) center / cover no-repeat var(--c-black);
	}

	.promo-headline {
		max-width: min(92cqi, 54rem);
		margin: 0;
		padding: 0.5em 0.9em;
		text-align: center;
		font-size: clamp(var(--fs-5), 3.2cqi, var(--fs-8));
		line-height: 1.3;
		color: var(--c-black);
		background: var(--c-white);
	}
</style>
