<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Colors from './+page.svelte';

	// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
	const { Story } = defineMeta({
		title: 'System/Colors',
		component: Colors,
		parameters: {
			// More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
			layout: 'fullscreen'
		}
	});
</script>

<Story name="System Colors" />
