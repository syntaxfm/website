<script lang="ts">
	import ComponentWindow from '$lib/ComponentWindow.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import { ComponentType } from 'svelte';

	const comp: ComponentType = NewsletterForm;
</script>

<ComponentWindow Component={comp} />
<iframe
	src="/show/600/600th-episode-major-announcement-and-swag-giveaway/embed"
	title="Show Embed"
	style="width: 100%; max-width: 800px;"
/>
