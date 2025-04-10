<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RankedItems from './RankedItems.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/RankedItems',
		component: RankedItems
	});
</script>

<Story name="Default" />
