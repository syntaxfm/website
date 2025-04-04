<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Buttons from './Buttons.svelte';

	// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
	const { Story } = defineMeta({
		title: 'System/Buttons',
		component: Buttons
	});
</script>

<Story name="Default" />
