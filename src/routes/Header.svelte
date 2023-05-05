<script lang="ts">
	import { page } from '$app/stores';
	import type { User } from '@prisma/client';
	import UserMenu from './UserMenu.svelte';
	import Logo from '$assets/logo.svg';

	export let user: User | null;

	$: header_element = $page.route.id === '/' ? 'h1' : 'h2';
</script>

<header>
	<svelte:element this={header_element}>
		<a href="/">
			<img src={Logo} alt="Syntax" />
		</a>
	</svelte:element>

	<nav>
		<a href="/podcast">Podcast</a>
		<a href="/articles">Articles</a>
		<a href="/video">Video</a>
		<a href="https://swag.syntax.fm">Swag</a>
	</nav>

	<UserMenu {user} />
</header>

<style>
	h1,
	h2 {
		margin: 0;
	}
</style>
