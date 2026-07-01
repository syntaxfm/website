<script lang="ts">
	import Input from '$lib/forms/Input.svelte';
	import swag from './swag.png';
	import { resolve } from '$app/paths';
	let is_hidden = $state(false);

	const FORM_ID = 5465361;
	let action = $derived(`https://app.convertkit.com/forms/${FORM_ID}/subscriptions`);

	function submit() {
		document.cookie = 'newsletter_visible=hidden';
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			is_hidden = document.cookie.includes('newsletter_visible');
		}
	});
</script>

{#if !is_hidden}
	<div class="newsletter-layout">
		<h5 id="newsletter-form-label">15% off your swag order</h5>
		<img src={swag} alt="Syntax Swag Photos" />
		<p>Subscribe to the Syntax<br /><a href={resolve('/snackpack')}>Snack Pack Newsletter</a></p>
		<form
			{action}
			onsubmit={submit}
			method="post"
			data-sv-form={FORM_ID}
			data-uid="05d939b74d"
			class="center readable"
			target="_blank"
			aria-labelledby="newsletter-form-label"
		>
			<div class="newsletter">
				<Input required type="email" label="Email" id="email_address" />
				<button type="submit">Subscribe</button>
			</div>
		</form>
	</div>
{/if}

<style lang="postcss">
	.newsletter-layout {
		position: relative;
		background: var(--c-primary);
		color: var(--c-black);
		padding: var(--pad-medium) var(--pad-medium) var(--pad-large);
		border-radius: var(--br-medium);
	}

	/* Compact tilted sticker floating over the image's top-left */
	h5 {
		position: absolute;
		top: var(--pad-small);
		left: var(--pad-medium);
		z-index: 2;
		background: var(--c-black);
		color: var(--c-white);
		font-size: var(--fs-1);
		font-variation-settings: var(--fv-700-italic);
		white-space: nowrap;
		padding: 8px 14px;
		border-radius: var(--br-small);
		rotate: -3deg;
	}

	/* Full-bleed image — spans the card edges, square corners, taller letterbox crop */
	img {
		display: block;
		width: calc(100% + 2 * var(--pad-medium));
		max-width: none;
		aspect-ratio: 2 / 1;
		object-fit: cover;
		margin-inline: calc(-1 * var(--pad-medium));
	}

	/* Dominant headline — larger and bolder than the band */
	p {
		color: var(--c-black);
		font-size: var(--fs-4);
		font-variation-settings: var(--fv-700-italic);
		letter-spacing: -0.03em;
		line-height: 1.3;
		text-align: center;
		margin: var(--pad-medium) 0 var(--pad-large);
	}

	p a {
		color: var(--c-black);

		&:hover {
			text-decoration: underline;
			text-decoration-color: var(--c-black);
		}
	}

	.newsletter {
		display: flex;
		align-items: stretch;
		gap: var(--pad-small);
	}

	.newsletter button {
		background: var(--c-black);
		color: var(--c-white);
		padding: var(--pad-small) var(--pad-medium);
		border-radius: var(--br-medium);
		line-height: 1.2;
		white-space: nowrap;

		&:hover {
			background: oklch(from var(--c-black) calc(l + 0.3) c h);
		}
	}

	.newsletter-layout :global(.input) {
		flex: 1;
	}

	/* Float the label clear above the input (input fills the row, so keep it out of flow) */
	.newsletter-layout :global(.input label) {
		top: auto;
		bottom: calc(100% + 6px);
		color: var(--c-black);
		font-size: var(--fs-2);
	}

	/* Fill the stretched wrapper so the input and button share one height/baseline */
	.newsletter-layout :global(input) {
		box-shadow: inset 0 0 0 3px var(--c-black);
		background: var(--c-white);
		color: var(--c-black);
		font-size: var(--fs-3);
		border-radius: var(--br-medium);
		height: 100%;
		width: 100%;
	}
</style>
