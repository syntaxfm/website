<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SideBarItem from './SidebarItem.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/SideBarItem',
		component: SideBarItem
	});
</script>

<Story name="Default" />
