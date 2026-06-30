<script lang="ts">
	import UserSubmissionForm from '$lib/forms/UserSubmissionForm.svelte';
	import Meta from '$lib/meta/Meta.svelte';
</script>

<Meta title="Ask a Potluck Question" />

<div class="potluck">
	<header class="hero">
		<h1 class="h1 fv-700-i">Ask a Potluck Question</h1>
		<div class="intro">
			<p>Once a month we do Potluck episodes.</p>
			<p>
				Have a question about web development? It can literally be about anything! Submit it in the
				form below and we will try and answer it on a future show! Feel free to ask anonymously if
				you prefer us not to mention your name.
			</p>
		</div>
	</header>

	<div class="graphic-card form-card">
		<UserSubmissionForm selected_submission_type="POTLUCK" />
	</div>
</div>

<style lang="postcss">
	.potluck {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		max-width: 66rem;
		padding-block: 1.5rem 4rem;
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-card {
		--form-margin: 0;

		padding: var(--pad-large);
	}

	@media (--below-med) {
		.form-card {
			padding: var(--pad-medium);
		}
	}
</style>
