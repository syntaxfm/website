<script lang="ts">
	import { Toaster } from 'svelte-french-toast';
	import Player from '$lib/player/Player.svelte';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import './style.css';
	import type { PageData } from './$types';
	import Loading from '$lib/Loading.svelte';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import ThemeMaker from '$lib/theme/ThemeMaker.svelte';
	import { theme } from '$state/theme';
	import { onMount } from 'svelte';
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
	<Header {user} />

	<div class="page-layout">
		<main>
			<slot />
		</main>
	</div>

	<Footer />

	<ThemeMaker />
	<Player />
	<Toaster />
	<Loading />

	{#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if}
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
		grid-column: 2;
	}

	.page-layout {
		max-width: 1600px;
		margin: 0 auto;
	}

	@media (min-width: 1280px) {
		.page-layout {
			gap: 48px;
			display: grid;
			grid-auto-flow: column;
			grid-template-columns: 144px minmax(0, 18fr) 144px;
			grid-template-rows: 1fr;
		}
	}
</style>
