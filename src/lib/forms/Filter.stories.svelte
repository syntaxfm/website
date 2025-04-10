<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Filter from './Filter.svelte';

	const { Story } = defineMeta({
		title: 'Forms/Filter',
		component: Filter
	});
</script>

<Story name="Default" />
