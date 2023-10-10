<script lang="ts">
	import Logo from '$lib/Logo.svelte';
	import Search from '$lib/search/Search.svelte';
	import MobileNav from './MobileNav.svelte';
	import { page } from '$app/stores';
	export let transparent: boolean = false;
</script>

<header class="layout" class:transparent>
	<div class="header-container content">
		<div class="logo">
			{#if $page.url.pathname !== '/'}
				<a title="Syntax Podcast" href="/">
					<Logo />
				</a>
			{/if}
		</div>

		<nav class="desktop_nav content">
			<a href="/shows">Shows</a>
			<a href="/about">About</a>
			<a href="/potluck">Potluck Qs</a>
			<a rel="noopener" target="_blank" href="https://swag.sentry.io">Swag</a>
			<Search />
			<MobileNav />
		</nav>
	</div>
</header>

<style lang="postcss">
	header {
		background-image: url('/grit.svg?dark');
		background-size: 250px;
		background-color: var(--bg);
		color: var(--fg);
		padding: 0 0.5rem;
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

	nav a {
		text-decoration: none;
		color: var(--fg);
		text-decoration: none;
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
		justify-content: end;
		align-items: center;
		.transparent & {
			grid-column: 1 / -1;
			justify-content: center;
		}
		a {
			display: block;
			text-decoration: none;
			background: rgba(255, 255, 255, 0.0786987545689);
			padding: 10px 20px;
			border: 0;
			border-radius: 20px;
			align-items: center;
			display: none;
			&:hover {
				border: 0;
				background: var(--primary);
				color: var(--bg);
			}
			@media (--above_med) {
				display: block;
			}
		}
	}
</style>
