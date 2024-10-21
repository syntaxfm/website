<script>
	import UserSubmissionForm from '$/lib/forms/UserSubmissionForm.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {any} form
	 */

	/** @type {Props} */
	let { form } = $props();
</script>

<main>
	<div style:margin-bottom="2rem">
		<h1 class="h3">Submit a Spooky Story!</h1>
		<p>It's time for our annual episode of web development horror stories!</p>

		<p>Have you goofed up at work? We want your story!</p>

		<p>
			Delete a production database? Let an SSL cert expire? Push code that shipped too much toilet
			paper to customers? Let a console.swear() slip into prod? Take down a hospital with a single
			line of code? We want to hear it!
		</p>

		<ul>
			<li>Everyone is kept anonymous</li>
			<li>
				Submit yours below, DM <a href="https://x.com/wesbos" target="_blank">@wesbos</a> or email
				<a href="mailto:wes@syntax.fm">wes@syntax.fm</a>
			</li>

			<li>Text, video or audio - anything goes!</li>
			<li>
				Listen to years past:
				<a href="/683">#683</a>
				<a href="/684">#684</a>
				<a href="/528">#528</a>
				<a href="/531">#531</a>
				<a href="/400">#400</a>
				<a href="/399">#399</a>
				<a href="/294">#294</a>
				<a href="/296">#296</a>
				<a href="/193">#193</a>
				<a href="/192">#192</a>
			</li>
		</ul>

		<UserSubmissionForm {form} />
	</div>
</main>
