<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SideBarItems from './SidebarItems.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/SideBarItems',
		component: SideBarItems
	});
</script>

<Story name="Default" />
