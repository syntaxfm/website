<script lang="ts">
	import { SideMenu } from '@leveluptuts/svelte-side-menu';
	import ThemeToggle from './theme/ThemeToggle.svelte';
</script>

<SideMenu
	top="40px"
	links={[
		{
			text: 'Admin'
		},
		{
			text: 'Dashboard',
			path: '/admin'
		},
		{
			text: 'Shows',
			path: '/admin/shows'
		},
		{
			text: 'Front End'
		},
		{
			text: 'Homepage',
			path: '/'
		},
		{
			text: 'Shows',
			path: '/podcast'
		}
	]}
>
	<ThemeToggle />
</SideMenu>
