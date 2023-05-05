<script lang="ts">
	import { SideMenu } from '@leveluptuts/svelte-side-menu';
</script>

<SideMenu
	top="40px"
	theme="exp"
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
/>
