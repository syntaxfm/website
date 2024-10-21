<script lang="ts">
	import ComponentWindow from '$lib/ComponentWindow.svelte';
	import NewsletterForm from '$/lib/newsletter/NewsletterForm.svelte';
	import type { Component } from 'svelte';

	const comp: Component = NewsletterForm;
</script>

<ComponentWindow Component={comp} />
<div class="content">
	<iframe
		scrolling="no"
		src="/embed/600"
		title="Show Embed"
		style="width: 100%; height: 230px; max-width: 1200px; border: 1px solid black"
	></iframe>
</div>
