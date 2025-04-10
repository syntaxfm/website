<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RankedSidebarItem from './RankedItem.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/RankedSidebarItem',
		component: RankedSidebarItem
	});
</script>

<Story name="Default" />
