<script lang="ts">
	import 'media-chrome';
	import { Toaster } from 'svelte-french-toast';
	import Player from '$lib/player/Player.svelte';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import './style.css';
	import type { PageData } from './$types';
	import Loading from '$lib/Loading.svelte';

	import ThemeMaker from '$lib/theme/ThemeMaker.svelte';
	import { theme } from '$state/theme';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SearchBox from '$lib/search/SearchBox.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import { debug_mode } from '$state/debug';
	// import { preparePageTransition } from '$lib/page_transition';

	// preparePageTransition();

	// Load current user from db, put it in context so we don't have to pass as props
	export let data: PageData;
	$: ({ user } = data);

	onMount(() => {
		// set the theme to the user's active theme
		$theme = user?.theme || 'system';
	});
</script>

<Meta />

<div class={'theme-' + $theme + ' theme-wrapper'} class:debug={$debug_mode}>
	<Header />

	<main class="page-layout layout">
		<slot />
	</main>

	<Footer />

	<ThemeMaker />
	<Player />
	<Toaster />
	<Loading />
	{#if browser}
		<SearchBox />
	{/if}

	{#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if}
</div>

<style lang="postcss">
	.theme-wrapper {
		color: var(--sheet-color);
		min-height: 100vh;
		border-top: var(--border);
		border-color: var(--primary);
	}

	main {
		background-color: white;
		padding: 0.5rem;
		@media (min-width: 1280px) {
			padding: 0;
		}
	}

	.page-layout {
		min-height: 80vh;
		margin: 0 auto;
		padding-bottom: 4rem;
	}

	@media (min-width: 1280px) {
		.page-layout {
			grid-auto-flow: column;
			grid-template-rows: 1fr;
		}
	}
</style>
