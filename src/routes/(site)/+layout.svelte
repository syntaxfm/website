<script lang="ts">
	import './style.css';
	import 'media-chrome';
	import 'youtube-video-element';
	import { Toaster } from 'svelte-french-toast';
	import { browser } from '$app/env';
	import { beforeNavigate, onNavigate } from '$app/navigation';
	import GlobalYoutubePlayer from '#lib/videos/GlobalYoutubePlayer.svelte';
	import { youtube_player } from '$state/youtube_player';
	import Loading from '#lib/Loading.svelte';
	import Footer from '#lib/layout/Footer.svelte';
	import Header from '#lib/layout/Header.svelte';
	import Meta from '#lib/meta/Meta.svelte';
	import PageLoadingIndicator from '#lib/page_loading_indicator.svelte';
	import Player from '#lib/player/Player.svelte';
	import SearchBox from '#lib/search/SearchBox.svelte';
	import ThemeMaker from '#lib/ThemeMaker.svelte';
	import FollowBanner from '#lib/social/FollowBanner.svelte';
	import { get_signed_in_user } from '#lib/admin/signed_in_user.remote.ts';
	import AdminMenu from './admin/AdminMenu.svelte';

	const { children } = $props();

	// Asked from the browser only: pages render the same for every visitor (the theme is set in
	// app.html), so they never carry the user. Read via `.current` so it never holds up the page.
	const signed_in_user = browser ? get_signed_in_user() : null;

	// The video keeps playing across pages, so save where it is before its page goes away
	beforeNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
		if (navigation.willUnload) return;
		youtube_player.before_navigate();
	});

	onNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
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

{#if signed_in_user?.current?.roles.includes('admin')}
	<AdminMenu />
{/if}
<div class="theme-wrapper">
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
