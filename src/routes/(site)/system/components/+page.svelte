<script lang="ts">
	import ComponentWindow from '$lib/ComponentWindow.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import { ComponentType } from 'svelte';

	const comp: ComponentType = NewsletterForm;
</script>

<ComponentWindow Component={comp} />
