<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SidebarGuests from './SidebarGuests.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/SidebarGuests',
		component: SidebarGuests
	});
</script>

<Story name="Default" />
