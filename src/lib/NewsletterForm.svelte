<script lang="ts">
	import Input from '$lib/forms/Input.svelte';
	let is_hidden = false;
	const FORM_ID = 5465361;
	$: action = `https://app.convertkit.com/forms/${FORM_ID}/subscriptions`;

	function submit() {
		document.cookie = 'newsletter_visible=hidden';
	}

	$: if (typeof document !== 'undefined') {
		is_hidden = document.cookie.includes('newsletter_visible');
	}
</script>

{#if !is_hidden}
	<form
		{action}
		on:submit={submit}
		method="post"
		data-sv-form={FORM_ID}
		data-uid="05d939b74d"
		class="center readable"
		target="_blank"
		aria-labelledby="newsletter-form-label"
	>
		<h3 id="newsletter-form-label" class="h4">Join our newsletter</h3>
		<p>
			New Syntax content, tips & tricks, swag drops, and other sweet stuff to make your life as a
			web developer even better.
		</p>

		<div class="newsletter">
			<Input required type="email" label="Email" id="email_address" />
			<button type="submit">Subscribe</button>
		</div>

		<p class="text-sm">Dip at any time.</p>
	</form>
{/if}

<style lang="postcss">
	@layer theme {
		form {
			container: newsletter-form / inline-size;
			text-align: center;
			padding: 2rem;
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

		@container newsletter-form (width < 400px) {
			p {
				font-size: var(--font-size-sm);
			}

			.newsletter button {
				width: 100%;
				max-width: 300px;
			}
			.small {
				font-size: var(--font-size-xs);
			}
		}

		@container newsletter-form (width > 600px) {
			button {
				width: auto;
			}
		}
	}
</style>
