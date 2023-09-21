<script lang="ts">
	import Logo from '$lib/Logo.svelte';
	import Search from '$lib/search/Search.svelte';
	import MobileNav from './MobileNav.svelte';
</script>

<header class="layout">
	<div class="header-container content">
		<div class="logo">
			<a href="/">
				<Logo />
				<span>× Sentry</span>
			</a>
		</div>

		<div class="header-actions">
			<Search />
			<a
				target="_blank"
				class="button ghost"
				rel="noopener"
				href="https://docs.google.com/forms/d/e/1FAIpQLSfQlAo1wXHiJMySdU-h8QMtfoz92aMS9eycEHXB6eRCLh8KHA/viewform"
				style="grid-column: 1/-1;">Ask a potluck question</a
			>

			<MobileNav />
		</div>
	</div>

	<nav class="desktop_nav content">
		<a href="/shows">Shows</a>
		<a href="/about">About</a>
		<a rel="noopener" target="_blank" href="https://swag.sentry.io">Swag</a>
	</nav>
</header>

<style lang="postcss">
	header {
		background-image: url('https://syntax.fm/static/background.jpg');
		background-color: var(--bg);
		color: var(--fg);
		padding: 0 0.5rem;
		@media (min-width: 1280px) {
			padding: 0;
			grid-auto-flow: column;
			grid-template-rows: 1fr auto;
		}
	}

	.header-container {
		display: grid;
		padding: 10px 0;
		align-items: center;
		row-gap: 20px;
		grid-template-columns: [start logo] 88px [logo actions] auto [actions end];
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

	.header-actions {
		display: flex;
		align-items: center;
		justify-self: flex-end;
		gap: 20px;
	}

	.header-actions {
		> a {
			display: none;
		}
		@media (--above_med) {
			> a {
				display: block;
			}
		}
	}

	.desktop_nav {
		display: none;
		a {
			display: block;
		}
		@media (--above_med) {
			grid-row: 2 / 2;
			grid-column: content / content;
			padding: 10px 0;
			gap: 10px;
			display: flex;
		}
	}

	svg {
		width: 50px;
		@media (--above_med) {
			width: 88px;
		}
	}

	.logo {
		a {
			display: flex;
			flex-direction: column;
			gap: 5px;
			align-items: center;
		}
		span {
			font-size: var(--font-size-sm);
			margin: 0;
			color: var(--white);
		}
	}
</style>
