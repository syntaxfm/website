<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Turnstile } from 'svelte-turnstile';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
	import { resolve } from '$app/paths';
	import swag from './swag.webp';
	import { subscribe_to_newsletter } from './newsletter.remote';

	let is_hidden = $state(false);

	// Turnstile loads Cloudflare's script, so the bot check starts once someone starts on the form
	let should_check_for_bots = $state(false);
	let has_bot_check_settled = $state(false);
	let turnstile_token = $state('');
	let reset_turnstile: (() => void) | undefined = $state();
	let on_bot_check_settled: (() => void) | undefined;

	const { fields } = subscribe_to_newsletter;
	let result = $derived(subscribe_to_newsletter.result);
	let error_message = $derived(
		fields.email_address.issues()?.[0]?.message ??
			(result && !result.is_subscribed ? result.message : undefined)
	);

	function settle_bot_check(token: string) {
		turnstile_token = token;
		has_bot_check_settled = true;
		on_bot_check_settled?.();
		on_bot_check_settled = undefined;
	}

	// The cookie is only readable in the browser
	onMount(() => {
		is_hidden = document.cookie.includes('newsletter_visible');
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

		{#if result?.is_subscribed}
			<p class="confirm" role="status">{result.message}</p>
		{:else}
			<form
				aria-labelledby="newsletter-card-title"
				onfocusin={() => (should_check_for_bots = true)}
				{...subscribe_to_newsletter.enhance(async ({ element, submit }) => {
					// Clicked before the bot check finished: send it again once it has
					if (!has_bot_check_settled) {
						should_check_for_bots = true;
						await new Promise<void>((done) => (on_bot_check_settled = done));
						await tick();
						element.requestSubmit();
						return;
					}
					try {
						await submit();
						if (subscribe_to_newsletter.result?.is_subscribed) {
							document.cookie = 'newsletter_visible=hidden; path=/; max-age=31536000';
						}
					} catch (error) {
						console.error('Newsletter signup failed', error);
					} finally {
						turnstile_token = '';
						has_bot_check_settled = false;
						reset_turnstile?.();
					}
				})}
			>
				<label for="newsletter-card-email">Email</label>
				<input
					id="newsletter-card-email"
					{...fields.email_address.as('email')}
					autocomplete="email"
					required
					aria-describedby={error_message ? 'newsletter-card-error' : undefined}
				/>
				<button type="submit" disabled={subscribe_to_newsletter.pending > 0}>Subscribe</button>
				{#if error_message}
					<p id="newsletter-card-error" class="error">{error_message}</p>
				{/if}
				<input {...fields.cf_turnstile_response.as('hidden', turnstile_token)} />
				<!-- Without a site key Turnstile throws while rendering -->
				{#if should_check_for_bots && PUBLIC_TURNSTILE_SITE_KEY}
					<Turnstile
						appearance="interaction-only"
						siteKey={PUBLIC_TURNSTILE_SITE_KEY}
						responseField={false}
						bind:reset={reset_turnstile}
						on:callback={(event) => settle_bot_check(event.detail.token)}
						on:error={() => settle_bot_check('')}
						on:timeout={() => settle_bot_check('')}
						on:expired={() => {
							turnstile_token = '';
							has_bot_check_settled = false;
						}}
					/>
				{/if}
			</form>
		{/if}
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
	p,
	label {
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
		grid-template-areas: 'label' 'input' 'error' 'button' 'check';
		gap: var(--pad-xsmall) 0;
		margin-top: var(--pad-xsmall);

		@container newsletter-card (width >= 420px) {
			grid-template-areas: 'label label' 'input button' 'error error' 'check check';
			grid-template-columns: 1fr auto;
			column-gap: var(--pad-small);
		}

		/* Turnstile's box, only there when Cloudflare wants a click */
		> :global(div) {
			grid-area: check;
		}
	}

	label {
		grid-area: label;
		font-size: var(--fs-2);
		font-variation-settings: var(--fv-700);
	}

	input,
	button {
		height: 44px;
		border-radius: var(--br-medium);
		font-size: var(--fs-3);
	}

	input {
		grid-area: input;
		width: 100%;
		padding: 0 12px;
		border: 2px solid var(--c-black);
		background: var(--c-white);
		color: var(--c-black);

		&[aria-invalid='true'] {
			border-color: var(--c-red);
		}
	}

	button {
		grid-area: button;
		display: grid;
		place-items: center;
		margin-top: var(--pad-xsmall);
		padding: 0 var(--pad-large);
		border: 0;
		background: var(--c-black);
		color: var(--c-white);
		font-variation-settings: var(--fv-700-italic);
		white-space: nowrap;
		cursor: pointer;

		@container newsletter-card (width >= 420px) {
			margin-top: 0;
		}

		&:hover {
			background: oklch(from var(--c-black) calc(l + 0.2) c h);
		}

		&:active {
			scale: 0.97;
		}

		&:disabled {
			cursor: progress;
			opacity: 0.7;
		}

		@media (prefers-reduced-motion: no-preference) {
			transition:
				background-color 150ms ease-out,
				scale 100ms ease-out,
				opacity 150ms ease-out;
		}
	}

	input:focus-visible,
	button:focus-visible {
		outline: 3px solid var(--c-black);
		outline-offset: 2px;
	}

	.error {
		grid-area: error;
		margin: 0;
		font-variation-settings: var(--fv-700);
	}

	/* Takes the form's place once Kit has the address */
	.confirm {
		font-size: var(--fs-3);
		font-variation-settings: var(--fv-700-italic);
	}
</style>
