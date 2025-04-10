<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SwaggyNewsletterForm from './SwaggyNewsletterForm.svelte';

	// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
	const { Story } = defineMeta({
		title: 'Blocks/SwaggyNewsletterForm',
		component: SwaggyNewsletterForm
	});
</script>

<Story name="Default" />
