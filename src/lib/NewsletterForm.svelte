<script lang="ts">
	import { enhance } from '$app/forms';
	import Input from '$lib/forms/Input.svelte';
	const FORM_ID = 5465361;
	$: action = `https://app.convertkit.com/forms/${FORM_ID}/subscriptions`;

	function submit(t) {
		console.log(t);
	}
</script>

<form
	{action}
	on:submit={submit}
	method="post"
	data-sv-form={FORM_ID}
	class="center readable"
	target="_blank"
>
	<h4>Join our newsletter</h4>
	<p>
		New Syntax content, tips & tricks, swag drops, and other sweet stuff to make your life as a web
		developer even better.
	</p>

	<div class="newsletter">
		<Input type="email" label="Email" />
		<button type="submit">Subscribe</button>
	</div>

	<p class="small">We respect your privacy. Control your preferences or unsubscribe at any time.</p>
</form>

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
