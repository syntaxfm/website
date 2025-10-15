<script lang="ts">
	import './style.css';
	import 'media-chrome';
	import 'youtube-video-element';
	import { Toaster } from 'svelte-french-toast';
	import { onNavigate } from '$app/navigation';
	import Player from '$lib/player/Player.svelte';
	import Footer from '$lib/layout/Footer.svelte';
	import Header from '$lib/layout/Header.svelte';
	import Loading from '$lib/Loading.svelte';
	import { browser } from '$app/environment';
	import SearchBox from '$lib/search/SearchBox.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import AdminMenu from '$lib/AdminMenu.svelte';
	import ThemeMaker from '../../params/ThemeMaker.svelte';
	import { page } from '$app/stores';
	import PageLoadingIndicator from '$lib/page_loading_indicator.svelte';
	import Icon from '$/lib/Icon.svelte';

	let { data, children } = $props();
	let { user, user_theme, latest } = $derived(data);

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
	{#if $page.url.pathname !== '/'}
		<Header />
	{/if}

	<Icon name="grid" />
	<Icon name="list" />
	<Icon name="mail-send" />

	<main id="main-content" class="layout zone" style:--c-bg="var(--c-bg)" style:--c-fg="var(--c-fg)">
		{@render children?.()}
	</main>

	<Footer />

	<ThemeMaker />

	{#if browser}
		<Player initial_show={latest[0]} />
	{/if}

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
