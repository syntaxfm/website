<script lang="ts">
	let links = [
		{
			text: 'Dashboard',
			path: '/admin'
		},
		{
			text: 'Shows',
			path: '/admin/shows'
		},
		{
			text: 'Video',
			path: '/admin/videos'
		},
		{
			text: 'Video Import',
			path: '/admin/videos/import'
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
	];
</script>

<div class="admin-menu">
	{#each links as link (link.path + 'admin-nav')}
		<a href={link.path}>{link.text}</a>
	{/each}
</div>

<style>
	.admin-menu {
		overflow: scroll;
		display: flex;
		gap: 20px;
		padding: 20px;
		flex-wrap: nowrap;
		border-bottom: var(--c-shade-or-tint) solid 1px;
		a {
			white-space: nowrap;
		}
	}
</style>
