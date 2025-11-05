<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();
	const LINKS = [
		{
			name: 'Dashboard',
			link: '/admin'
		},
		{
			name: 'Content',
			link: '/admin/content'
		},
		{
			name: 'Shows',
			link: '/admin/shows'
		},
		{
			name: 'Articles',
			link: '/admin/articles'
		},
		{
			name: 'Tools',
			link: '/admin/tools'
		},
		{
			name: 'Transcripts',
			link: '/admin/transcripts'
		},
		{
			name: 'Video',
			link: '/admin/videos'
		},
		{
			name: 'Submissions',
			link: '/admin/submissions'
		}
	];
</script>

<nav>
	{#each LINKS as link}
		<a class:active={page.url.pathname === link.link} href={link.link}>{link.name}</a>
	{/each}
</nav>

<div class="admin stack">
	{@render children?.()}
</div>

<style>
	nav {
		padding: 1rem 0;
		display: flex;
		gap: 20px;

		a {
			color: var(--c-fg);
		}

		.active {
			text-decoration: underline;
		}
	}

	.admin {
		padding-bottom: 4rem;
	}
</style>
