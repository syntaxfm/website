<script lang="ts">
	const FORM_ID = 5465361;
	$: action = `https://app.convertkit.com/forms/${FORM_ID}/subscriptions`;
</script>

<form {action} method="post" data-sv-form={FORM_ID} class="readable center">
	<h4>Join our newsletter</h4>
	<p>
		New Syntax content, tips & tricks, swag drops, and other sweet stuff to make your life as a web
		developer even better.
	</p>
	<label for="email">Email </label>
	<input type="email" id="email" />
	<button type="submit">Subscribe</button>

	<p class="small">We respect your privacy. Control your preferences or unsubscribe at any time.</p>
</form>

<style lang="postcss">
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
	button {
		width: 100%;
	}
	@container newsletter-form (width < 600px) {
	}
	@container newsletter-form (width > 600px) {
		button {
			width: auto;
		}
	}
</style>
