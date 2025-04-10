<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SidebarGuest from './SidebarGuest.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/SidebarGuest',
		component: SidebarGuest
	});
</script>

<Story name="Default" />
