<script lang="ts">
	import { page } from '$app/stores';

	import type { User } from '@prisma/client';
	import { getContext } from 'svelte';
	import UserMenu from './UserMenu.svelte';

	const user = getContext<User | null>('user');
</script>

<header>
	{#if $page.route.id === '/'}
		<h1>Syntax</h1>
	{:else}
		<h2>Syntax</h2>
	{/if}

	<nav>
		<a href="/podcast">Podcast</a>
		<a href="/articles">Articles</a>
		<a href="/video">Video</a>
		<a href="https://swag.syntax.fm">Swag</a>
	</nav>

	<UserMenu />
</header>
