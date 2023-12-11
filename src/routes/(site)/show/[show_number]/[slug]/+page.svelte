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
	<div
		class="sticky zone"
		style="border: solid 0.5px var(--black-1)"
		style:--radius="20px"
		style:--bg="var(--bg-1)"
	>
		<NewsletterForm />
	</div>
</div>
