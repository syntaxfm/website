<script lang="ts">
	import Input from '$lib/forms/Input.svelte';
	import swag from './swag.png';
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
	<div class="newsletter-layout card">
		<h5 class="h6">15% off your swag order</h5>
		<img src={swag} alt="Syntax Swag Photos" />
		<p>Subscribe to the Syntax<br /><a href="/snackpack">Snack Pack Newsletter</a></p>
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
				<button class="black small" type="submit">Subscribe</button>
			</div>
		</form>
	</div>
{/if}

<style lang="postcss">
	h5 {
		background: var(--black);
		color: var(--white);
		padding: 10px 15px;
		rotate: -2deg;
		z-index: 3;
		position: relative;
	}

	img {
		margin: -10px -20px 0;
		width: calc(100% + 40px);
	}

	p {
		font-style: italic;
		margin: 0.5rem 0 1.5rem;
		text-align: center;
		font-size: var(--font-size-s);
	}

	.newsletter {
		display: flex;
		gap: 2px;
	}

	.newsletter-layout :global(input) {
		box-shadow: inset 0 0 0 3px var(--black);
		font-size: var(--font-size-s);
		width: 100%;
	}
	.newsletter-layout :global(.input) {
		width: 100%;
	}

	a {
		text-decoration: underline;
	}

	.newsletter-layout {
		background: var(--primary);
		color: var(--black);
	}
</style>
