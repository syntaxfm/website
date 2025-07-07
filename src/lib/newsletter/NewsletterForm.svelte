<script lang="ts">
	import NewsletterLogo from './NewsletterLogo.svelte';
	import Input from '$lib/forms/Input.svelte';
	let is_hidden = $state(false);

	interface Props {
		show_logo?: boolean;
	}

	let { show_logo = true }: Props = $props();

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
		class="center readable"
		target="_blank"
		aria-labelledby="newsletter-form-label"
	>
		<h5 class="readable join fst-400-i">
			Join our newsletter for <strong>15% off</strong> all Syntax & Sentry swag
		</h5>

		<div class="newsletter">
			<Input required type="email" label="Email" id="email_address" />
			<button type="submit">Subscribe</button>
		</div>
		<p>Hot takes, tips & tricks, new content, swag drops & more</p>

		<p class="text-sm">Dip at any time.</p>
	</form>
</div>

<style lang="postcss">
	.join {
		margin: 3rem 0;
	}

	strong {
		font-variation-settings: var(--fw-800-italic);
	}

	@layer theme {
		.newsletter-layout {
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

		@container newsletter-form (width < 600px) {
			form {
				/* shrink form when small container */
				flex: 1 1 100%;
			}
			p {
				font-size: var(--font-size-sm);
			}

			.newsletter button {
				width: 100%;
				max-width: 300px;
			}
		}

		@container newsletter-form (width >= 600px) {
			button {
				width: auto;
			}
		}
	}
</style>
