<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SwaggyNewsletterForm from './SwaggyNewsletterForm.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/SwaggyNewsletterForm',
		component: SwaggyNewsletterForm
	});
</script>

<Story name="Default" />
