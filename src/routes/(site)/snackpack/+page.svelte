<script>
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	export let data;
</script>

<main>
	<div style:margin-top="2rem">
		<h1 class="h3 lines">Syntax Snack Pack</h1>
		<p class="center">Wanna be the <strong>{data.count}</strong> coolest person in the world?</p>
		<NewsletterForm />
	</div>
</main>
