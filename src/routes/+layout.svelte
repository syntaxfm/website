<script lang="ts">
	import { Toaster } from 'svelte-french-toast';
	import Player from '$lib/Player.svelte';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import './style.css';
	import type { PageData } from './$types';
	import Loading from '$lib/Loading.svelte';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import ThemeMaker from '$lib/theme/ThemeMaker.svelte';
	import { theme } from '$state/theme';
	import { onMount } from 'svelte';

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

	<div class="pusher">
		<main>
			<slot />
		</main>
		<ThemeMaker />
	</div>
	<Footer />

	<!-- Putting this here for now, will be available on every page -->
	<Player />
	<Toaster />
	<Loading />

	{#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if}
</div>

<style lang="postcss">
	main {
		background-color: var(--sheet-bg);
		color: var(--sheet-color);
		max-width: 1000px;
		margin: 0px auto;
		padding: 2rem;
		width: 100vw;
	}

	.pusher {
		position: relative;
		overflow: hidden;
	}
</style>
