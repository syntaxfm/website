<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProducedBySentry from './ProducedBySentry.svelte';

	// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
	const { Story } = defineMeta({
		title: 'Layout/ProducedBySentry',
		component: ProducedBySentry
	});
</script>

<Story name="Default" />
