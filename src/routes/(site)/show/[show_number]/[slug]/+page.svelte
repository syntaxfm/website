<script lang="ts">
	import NewsletterForm from '$lib/NewsletterForm.svelte';

	export let data;
	$: ({ show } = data);
</script>

<div class="main">
	<div class="show-notes">
		{@html show.show_notes}
	</div>
</div>

<div class="sidebar">
	<div class="sticky zone card">
		<NewsletterForm />
	</div>
</div>
