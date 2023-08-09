<script lang="ts">
	import { SideMenu } from '@leveluptuts/svelte-side-menu';
	import { debug_mode } from '$state/debug';
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
	<label
		>🐛 Debug Mode:
		<input type="checkbox" bind:checked={$debug_mode} />
	</label>

	<ThemeToggle />
</SideMenu>
