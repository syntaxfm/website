<script lang="ts">
	import { SideMenu } from '@leveluptuts/svelte-side-menu';
	import ThemeToggle from './theme/ThemeToggle.svelte';
	import { enhance } from '$app/forms';
	import { form_action } from './form_action';
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
			text: 'Transcripts',
			path: '/admin/transcripts'
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
	<div>
		<form action="/?/dump_cache" use:enhance={form_action()} method="POST">
			<button>Dump Cache</button>
		</form>
	</div>
</SideMenu>
