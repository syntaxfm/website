<script lang="ts">
	import { page } from '$app/stores';
	const LINKS = [
		{
			name: 'Dashboard',
			link: '/admin'
		},
		{
			name: 'Shows',
			link: '/admin/shows'
		},
		{
			name: 'Transcripts',
			link: '/admin/transcripts'
		},
		{
			name: 'Cache',
			link: '/admin/cache'
		}
	];
</script>

<nav>
	{#each LINKS as link}
		<a class:active={$page.url.pathname === link.link} href={link.link}>{link.name}</a>
	{/each}
</nav>

<div class="admin">
	<slot />
</div>

<style lang="postcss">
	nav {
		padding: 1rem 0;
		display: flex;
		gap: 20px;
		a {
			color: var(--fg);
		}
		.active {
			text-decoration: underline;
		}
	}
	.admin {
		padding-bottom: 4rem;
	}
</style>
