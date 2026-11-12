<script lang="ts">
	import Input from '#lib/forms/Input.svelte';
	import swag from './swag.webp';
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
	<section class="newsletter-card" aria-labelledby="newsletter-card-title">
		<img
			src={swag}
			alt="A Syntax skateboard, t-shirt and basketball"
			width="642"
			height="214"
			loading="lazy"
			decoding="async"
		/>
		<p class="sticker">15% off your swag order</p>

		<h3 id="newsletter-card-title"><a href={resolve('snackpack')}>Syntax Snack Pack</a></h3>
		<p>Our newsletter: hot takes, tips & tricks, new content and swag drops.</p>

		<form
			{action}
			onsubmit={submit}
			method="post"
			data-sv-form={FORM_ID}
			data-uid="05d939b74d"
			target="_blank"
			aria-labelledby="newsletter-card-title"
		>
			<Input required type="email" label="Email" id="email_address" autocomplete="email" />
			<button type="submit">Subscribe</button>
		</form>
	</section>
{/if}

<style lang="postcss">
	.newsletter-card {
		container: newsletter-card / inline-size;
		position: relative;
		overflow: clip;
		display: grid;
		gap: var(--pad-small);
		padding-bottom: var(--pad-medium);
		background: var(--c-primary);
		color: var(--c-black);
		border-radius: var(--br-medium);

		/* Text and form sit inside the card's padding, the picture runs edge to edge */
		> :not(img, .sticker) {
			margin: 0;
			padding-inline: var(--pad-medium);
		}
	}

	/* The whole strip of swag, at its own 3:1 shape. In a wide card it's cropped, so the picture
	   doesn't push the form down. */
	img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 180px;
		aspect-ratio: 642 / 214;
		object-fit: cover;
	}

	/* Tilted sticker over the picture's top left */
	.sticker {
		position: absolute;
		top: var(--pad-small);
		left: var(--pad-small);
		margin: 0;
		padding: 6px 12px;
		background: var(--c-black);
		color: var(--c-white);
		font-size: var(--fs-1);
		font-variation-settings: var(--fv-700-italic);
		white-space: nowrap;
		border-radius: var(--br-small);
		rotate: -3deg;
	}

	/* The card is yellow in both themes, so its text stays black where the page's would turn white */
	h3,
	p {
		color: var(--c-black);
	}

	h3 {
		padding-top: var(--pad-small);
		font-size: var(--fs-5);
		font-variation-settings: var(--fv-700-italic);
		line-height: 1.15;

		a {
			color: inherit;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	p {
		font-size: var(--fs-2);
		line-height: 1.4;
	}

	/* Stacked in the sidebar, where an email address needs the whole width. Side by side once
	   there's room for both. */
	form {
		display: grid;
		gap: var(--pad-small);
		margin-top: var(--pad-xsmall);

		@container newsletter-card (width >= 420px) {
			grid-template-columns: 1fr auto;
			align-items: end;
		}
	}

	/* The shared input floats its label over the field; here it sits above it, in the flow */
	form :global(.input) {
		display: block;
	}

	form :global(.input label) {
		position: static;
		display: block;
		margin-bottom: var(--pad-xsmall);
		color: var(--c-black);
		font-size: var(--fs-2);
		font-variation-settings: var(--fv-700);
	}

	form :global(.input input),
	button {
		height: 44px;
		border-radius: var(--br-medium);
		font-size: var(--fs-3);
	}

	form :global(.input input) {
		width: 100%;
		padding: 0 12px;
		border: 2px solid var(--c-black);
		background: var(--c-white);
		color: var(--c-black);
	}

	button {
		display: grid;
		place-items: center;
		padding: 0 var(--pad-large);
		border: 0;
		background: var(--c-black);
		color: var(--c-white);
		font-variation-settings: var(--fv-700-italic);
		white-space: nowrap;
		cursor: pointer;

		&:hover {
			background: oklch(from var(--c-black) calc(l + 0.2) c h);
		}

		&:active {
			scale: 0.97;
		}

		@media (prefers-reduced-motion: no-preference) {
			transition:
				background-color 150ms ease-out,
				scale 100ms ease-out;
		}
	}

	form :global(.input input:focus-visible),
	button:focus-visible {
		outline: 3px solid var(--c-black);
		outline-offset: 2px;
	}
</style>
