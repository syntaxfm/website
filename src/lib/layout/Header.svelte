<script lang="ts">
	import Logo from '$/lib/layout/Logo.svelte';
	import Search from '$lib/search/Search.svelte';
	import { page } from '$app/state';
	interface Props {
		transparent?: boolean;
	}

	let { transparent = false }: Props = $props();
</script>

<header class="layout full" class:transparent style:--fg="var(--fg-1)">
	<div class="content">
		<div class="logo">
			{#if page.url.pathname !== '/'}
				<a title="Syntax Podcast Home" href="/">
					<Logo />
				</a>
			{/if}
		</div>

		<nav class="content">
			<a class={page.url.pathname.startsWith('/shows') ? 'active' : ''} href="/shows">Shows</a>
			<a class={page.url.pathname.startsWith('/videos') ? 'active' : ''} href="/videos">Video</a>
			<a class={page.url.pathname.startsWith('/snackpack') ? 'active' : ''} href="/snackpack"
				>Newsletter</a
			>
			<a class={page.url.pathname.startsWith('/about') ? 'active' : ''} href="/about">About</a>
			<a class={page.url.pathname.startsWith('/potluck') ? 'active' : ''} href="/potluck"
				>Potluck Qs</a
			>
			<a target="_blank" href="https://sentry.shop">Swag</a>
			<Search />
		</nav>
	</div>
</header>
