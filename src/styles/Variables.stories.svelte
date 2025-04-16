<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Variables from './Variables.svelte';

	const { Story } = defineMeta({
		title: 'System/CSS Variables',
		component: Variables
	});
</script>

<Story name="Default" />
