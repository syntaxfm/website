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

<div class={'theme-' + $theme + ' theme-wrapper'}>
	<Header />

	<div class="page-layout main-layout">
		<main class="place-content">
			<slot />
		</main>
	</div>

	<Footer />

	<ThemeMaker />
	<Player />
	<Toaster />
	<Loading />
	{#if browser}
		<SearchBox />
	{/if}

	<!-- {#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if} -->
</div>

<style lang="postcss">
	.theme-wrapper {
		background-color: var(--sheet-bg);
		color: var(--sheet-color);
		min-height: 100vh;
		border-top: 8px solid var(--primary);
	}

	main {
		padding: 2rem;
		@media (min-width: 1280px) {
			padding: 0;
		}
	}

	.page-layout {
		max-width: 1600px;
		min-height: 80vh;
		margin: 0 auto;
	}

	@media (min-width: 1280px) {
		.page-layout {
			grid-auto-flow: column;
			grid-template-rows: 1fr;
		}
	}
</style>
