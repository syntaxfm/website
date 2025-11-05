<script lang="ts">
	import UserSubmissionForm from '$lib/forms/UserSubmissionForm.svelte';
	import Meta from '$lib/meta/Meta.svelte';

	let { form } = $props();
</script>

<Meta
	title="$50,000 for Open Source"
	description="Syntax is Pledging $50,000 to open source projects."
/>

<main>
	<div style:margin-bottom="2rem">
		<h1 class="h3">Syntax Pledging $50,000 for Open Source</h1>
		<div class="oss">
			<div>
				<img
					src="https://opensourcepledge.com/images/piggybank.webp"
					alt="Hand placing money into a computer"
				/>
			</div>
			<div>
				<p><a href="https://opensourcepledge.com/">The Open Source Pledge</a> just launched.</p>

				<p>
					Sentry has pledged <strong>$750,000</strong> for this year, of which we get
					<strong>$50,000</strong> to distribute to open source projects!
				</p>

				<p>
					Is there a project you can't live without? A dependency <a
						target="_blank"
						href="https://xkcd.com/2347/">propping up the entire ecosystem</a
					>? A maintainer exploring new ground? <strong>Send us your suggestions!</strong>
				</p>

				<p>
					Include links to the projects and a brief explanation as to why you think project or
					maintainer deserves it.
				</p>

				<p>
					We will collect submissions until mid November, and announce them on an upcoming episode
					of Syntax.
				</p>

				<p>
					Do you work at a company that uses open source software? We would like to encourage you to
					join <a href="https://opensourcepledge.com/">The Open Source Pledge</a>.
				</p>
			</div>
		</div>

		<UserSubmissionForm {form} selected_submission_type="OSS" />
	</div>
</main>

<style lang="postcss">
	.oss {
		margin: 0 auto;
		text-wrap: pretty;
		display: grid;

		@media (--above-med) {
			grid-template-columns: 250px 1fr;
		}

		gap: 2rem;
		place-items: center;

		img {
			width: 100%;
			max-width: 200px;
		}
	}

	h1 {
		text-align: center;
	}
</style>
