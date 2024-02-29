<script lang="ts">
	import './style.css';
	import 'media-chrome';
	import Cookie from 'js-cookie';
	import { Toaster } from 'svelte-french-toast';
	import { onNavigate } from '$app/navigation';
	import Player from '$lib/player/Player.svelte';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import Loading from '$lib/Loading.svelte';
	import Hotkeys from '$lib/hotkeys/Hotkeys.svelte';
	import { browser } from '$app/environment';
	import SearchBox from '$lib/search/SearchBox.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import ThemeMaker from '../../params/ThemeMaker.svelte';
	import { page } from '$app/stores';
	import PageLoadingIndicator from '$lib/page_loading_indicator.svelte';

	export let data;
	$: ({ user, user_theme } = data);

	onNavigate(async (navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((oldStateCaptureResolve) => {
			document.startViewTransition(async () => {
				oldStateCaptureResolve();
				await navigation.complete;
			});
		});
	});
</script>

<Meta />

<PageLoadingIndicator />

<div class={'theme-' + user_theme + ' theme-wrapper'}>
	<!-- <UnderConstruction /> -->
	{#if $page.url.pathname !== '/'}
		<Header />
	{/if}

	<main class="page-layout layout zone" style:--bg="var(--bg-sheet)" style:--fg="var(--fg-sheet)">
		<slot />
	</main>

	<Footer />

	<ThemeMaker />
	<Player />
	<Toaster />
	<Loading />
	<Hotkeys />

	{#if browser}
		<SearchBox />
	{/if}

	{#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if}
</div>

<style lang="postcss">
	.theme-wrapper {
		--bg-root: var(--bg);
		--fg-root: var(--fg);
		min-height: 100vh;
		border-top: var(--border);
		border-color: var(--primary);
	}

	.page-layout {
		margin: 0 auto;
	}

	@media (min-width: 1280px) {
		.page-layout {
			grid-auto-flow: column;
			grid-template-rows: 1fr;
		}
	}
</style>
