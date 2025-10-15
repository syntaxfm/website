<script lang="ts">
	import './style.css';
	import 'media-chrome';
	import 'youtube-video-element';
	import Icon from '$/lib/Icon.svelte';
	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import Loading from '$lib/Loading.svelte';
	import Footer from '$lib/layout/Footer.svelte';
	import Header from '$lib/layout/Header.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import PageLoadingIndicator from '$lib/page_loading_indicator.svelte';
	import Player from '$lib/player/Player.svelte';
	import SearchBox from '$lib/search/SearchBox.svelte';
	import ThemeMaker from '../../params/ThemeMaker.svelte';

	const { data, children } = $props();
	const { user, user_theme, latest } = $derived(data);

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
<a href="#main-content" class="skip-to-main-content">Skip to main content</a>
<PageLoadingIndicator />

<div class={'theme-' + user_theme + ' theme-wrapper'}>
	<Header />

	<main id="main-content">
		<svelte:boundary>
			{@render children?.()}
			{#snippet pending()}{/snippet}
		</svelte:boundary>
	</main>

	<Footer />

	<ThemeMaker />

	{#if browser}
		<Player initial_show={latest[0]} />
	{/if}

	<Loading />

	{#if browser}
		<SearchBox />
	{/if}

	{#if user?.roles?.includes('admin')}
		<AdminMenu />
	{/if}
</div>

<style lang="postcss">
	.skip-to-main-content {
		position: absolute;
		top: -1000px;
		left: -1000px;
		z-index: 1000;
		background-color: var(--c-primary);
		color: var(--c-bg);
		padding: 0.5rem;

		&:focus {
			top: 0;
			left: 0;
		}
	}
</style>
