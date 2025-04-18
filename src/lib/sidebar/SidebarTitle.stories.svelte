<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SidebarTitle from './SidebarTitle.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/SidebarTitle',
		component: SidebarTitle
	});
</script>

<Story name="Default" args={{ title: '_MOST_POPULAR_THIS_WEEK()' }} />
