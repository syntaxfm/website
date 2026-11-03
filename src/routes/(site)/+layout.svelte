<script lang="ts">
	import './style.css';
	import 'media-chrome';
	import 'youtube-video-element';
	import { Toaster } from 'svelte-french-toast';
	import { browser } from '$app/environment';
	import { beforeNavigate, onNavigate } from '$app/navigation';
	import GlobalYoutubePlayer from '$lib/videos/GlobalYoutubePlayer.svelte';
	import { youtube_player } from '$state/youtube_player';
	import Loading from '$lib/Loading.svelte';
	import Footer from '$lib/layout/Footer.svelte';
	import Header from '$lib/layout/Header.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import PageLoadingIndicator from '$lib/page_loading_indicator.svelte';
	import Player from '$lib/player/Player.svelte';
	import SearchBox from '$lib/search/SearchBox.svelte';
	import ThemeMaker from '../../params/ThemeMaker.svelte';
	import FollowBanner from '$lib/social/FollowBanner.svelte';
	import AdminMenu from './admin/AdminMenu.svelte';

	const { data, children } = $props();
	const { user, user_theme } = $derived(data);

	// The video keeps playing across pages, so save where it is before its page goes away
	beforeNavigate((navigation) => {
		if (navigation.willUnload) return;
		youtube_player.before_navigate();
	});

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

{#if user?.roles?.includes('admin')}
	<AdminMenu />
{/if}
<div class={'theme-' + user_theme + ' theme-wrapper'}>
	<Header />

	<main id="main-content" class="layout-main">
		{@render children?.()}
	</main>

	<FollowBanner />

	<Footer />

	<ThemeMaker />

	{#if browser}
		<Player />
		<GlobalYoutubePlayer />
	{/if}

	<Toaster />

	<Loading />

	{#if browser}
		<SearchBox />
	{/if}
</div>

<style>
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
