<script lang="ts">
	import NewsletterLogo from './NewsletterLogo.svelte';
	import Input from '$lib/forms/Input.svelte';
	type NewsletterFormVariant = 'default' | 'snackpack_hero';

	interface Props {
		show_logo?: boolean;
		variant?: NewsletterFormVariant;
	}

	let { show_logo = true, variant = 'default' }: Props = $props();

	const FORM_ID = 5465361;
	let action = $derived(`https://app.convertkit.com/forms/${FORM_ID}/subscriptions`);

	function submit() {
		document.cookie = 'newsletter_visible=hidden';
	}
</script>

<div class="newsletter-layout">
	{#if show_logo}
		<div class="newsletter-logo-container">
			<a href="/snackpack">
				<NewsletterLogo />
			</a>
		</div>
	{/if}
	<form
		{action}
		onsubmit={submit}
		method="post"
		data-sv-form={FORM_ID}
		data-uid="05d939b74d"
		class={{ center: true, readable: true, 'form--snackpack_hero': variant === 'snackpack_hero' }}
		target="_blank"
		aria-label={variant === 'snackpack_hero' ? 'Subscribe to the Snack Pack newsletter' : undefined}
		aria-labelledby={variant === 'default' ? 'newsletter-form-label' : undefined}
	>
		{#if variant === 'default'}
			<h5 id="newsletter-form-label" class="readable join fv-400-i">
				Join our newsletter for <strong>15% off</strong> all Syntax & Sentry swag
			</h5>
		{/if}

		<div class={{ newsletter: true, 'newsletter--snackpack_hero': variant === 'snackpack_hero' }}>
			<Input required type="email" label="Email" id="email_address" />
			<button class="button-graphic large" type="submit">
				{variant === 'snackpack_hero' ? 'Subscribe!' : 'Subscribe'}
			</button>
		</div>

		{#if variant === 'default'}
			<p>Hot takes, tips & tricks, new content, swag drops & more</p>

			<p class="fs-caption">Dip at any time.</p>
		{/if}
	</form>
</div>

<style lang="postcss">
	.join {
		margin: 3rem 0;
	}

	strong {
		font-variation-settings: var(--fv-800-italic);
	}

	@layer theme {
		.newsletter-layout {
			width: 100%;
			container: newsletter-form / inline-size;
			display: flex;
			flex-flow: wrap;
			justify-content: center;
			flex-direction: row;

			.newsletter-logo-container {
				display: flex;
				align-items: center;
				flex: 0 0 250px;
				margin: 0 0 2rem;
			}
		}

		.form--snackpack_hero {
			max-width: min(96vw, 980px);
			text-align: initial;
			margin-top: clamp(0.5rem, 1.6vw, 0.9rem);

			:global(label) {
				top: -0.95rem;
				left: 0.55rem;
				font-size: var(--fs-2);
				font-variation-settings: var(--fv-700);
				letter-spacing: 0.03em;
				text-transform: uppercase;
				color: var(--c-black);
			}

			:global(.input) {
				flex: 1 1 340px;
			}

			:global(.input input) {
				min-height: 4.1rem;
				border-radius: 0;
				border: 3px solid var(--c-black);
				box-shadow: none;
				background: var(--c-white);
				color: var(--c-black);
				font-size: clamp(var(--fs-3), 1.9vw, var(--fs-4));
				padding: 0.9rem 1rem;
			}
		}

		form {
			flex: 1 0 500px;
			text-align: center;

			/* max-width: 500px; */
			> *:first-child {
				margin-top: 0;
			}

			> *:last-child {
				margin-bottom: 0;
			}
		}

		.newsletter {
			display: flex;
			gap: 10px;
			justify-content: center;
			flex-wrap: wrap;
			margin: 2rem 0;

			:global(.input) {
				width: clamp(200px, 300px, 400px);
			}
		}

		.newsletter--snackpack_hero {
			margin: 0;
			padding: 0;
			align-items: center;
			justify-content: center;
			gap: 0.8rem;
			flex-wrap: nowrap;
		}

		@container newsletter-form (width < 600px) {
			form {
				/* shrink form when small container */
				flex: 1 1 100%;
			}

			p {
				font-size: var(--fs-3);
			}

			.newsletter button {
				width: 100%;
				max-width: 300px;
			}

			.newsletter--snackpack_hero {
				flex-wrap: wrap;
			}
		}

		@container newsletter-form (width >= 600px) {
			button {
				width: auto;
			}
		}
	}
</style>
