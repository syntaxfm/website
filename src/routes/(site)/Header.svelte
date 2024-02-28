<script lang="ts">
	import Logo from '$lib/Logo.svelte';
	import Search from '$lib/search/Search.svelte';
	import MobileNav from './MobileNav.svelte';
	import { page } from '$app/stores';
	export let transparent: boolean = false;
</script>

<header class="layout" class:transparent style:--fg="var(--fg-1)">
	<div class="header-container content">
		<div class="logo">
			{#if $page.url.pathname !== '/'}
				<a title="Syntax Podcast" href="/">
					<Logo />
				</a>
			{/if}
		</div>

		<nav class="desktop_nav content">
			<a class={$page.url.pathname.startsWith('/shows') ? 'active' : ''} href="/shows">Shows</a>
			<a class={$page.url.pathname.startsWith('/snackpack') ? 'active' : ''} href="/snackpack"
				>Newsletter</a
			>
			<a class={$page.url.pathname.startsWith('/about') ? 'active' : ''} href="/about">About</a>
			<a class={$page.url.pathname.startsWith('/potluck') ? 'active' : ''} href="/potluck"
				>Potluck Qs</a
			>
			<a target="_blank" href="https://sentry.shop">Swag</a>
			<Search />
			<MobileNav />
		</nav>
	</div>
</header>

<style lang="postcss">
	header {
		background-image: url('/svg/grit.svg?dark'),
			linear-gradient(to bottom, var(--header-gradient-1) 0%, var(--header-gradient-2) 100%);
		background-size: 250px;
		background-color: var(--bg);
		color: var(--fg);
		padding: 0 0.5rem;
		@media (--below_large) {
			padding: 0;
		}

		&.transparent {
			background: none;
		}
	}

	.header-container {
		display: grid;
		padding: 10px 0;
		align-items: center;
		row-gap: 20px;
		grid-template-columns: 88px auto;
		margin: 0 auto;
	}

	.logo {
		width: 58px;
		@media (--above_med) {
			width: auto;
		}
	}

	nav a {
		text-decoration: none;
		color: var(--fg);
		text-decoration: none;
		white-space: nowrap;
		border-bottom: solid 3px transparent;
		transition: border-color 0.2s ease;
		&:hover {
			border-bottom: solid 3px var(--primary);
		}
	}

	.desktop_nav {
		display: flex;
		padding: 10px 0;
		gap: 10px;
		@media (--below_large) {
			gap: 5px;
		}

		justify-content: flex-end;
		align-items: center;
		.transparent & {
			grid-column: 1 / -1;
			justify-content: center;
		}
		a {
			display: block;
			text-decoration: none;
			background: var(--nav_a_bg, rgba(255, 255, 255, 0.0786987545689));
			padding: 10px 20px;
			@media (--below_large) {
				padding: 8px 16px;
			}
			border: 0;
			border-radius: 20px;
			align-items: center;
			display: none;
			&:hover {
				border: 0;
				background: var(--primary);
				color: var(--bg);
			}
			&.active {
				background-color: var(--primary);
				color: var(--bg);
			}
			@media (--above_med) {
				display: block;
			}
		}
	}
</style>
