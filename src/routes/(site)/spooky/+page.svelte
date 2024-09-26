<script>
	import UserSubmissionForm from '$/lib/forms/UserSubmissionForm.svelte';
	export let form;
</script>

<main>
	<div style:margin-bottom="2rem">
		<h1 class="h3">Submit a Spooky Story!</h1>
		<UserSubmissionForm {form} />
	</div>
</main>
