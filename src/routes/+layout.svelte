<script lang="ts">
	import { Toaster } from 'svelte-french-toast';
	import Player from '$lib/Player.svelte';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import './style.css';

	import type { PageData } from './$types';
	import { setContext } from 'svelte';
	import Loading from '$lib/Loading.svelte';

	// Load current user from db, put it in context so we don't have to pass as props
	export let data: PageData;
	$: ({ user } = data);
	$: setContext('user', user);
</script>

<Header />

<main>
	<slot />
</main>
<Footer />

<!-- Putting this here for now, will be available on every page -->
<Player />
<Toaster />
<Loading />

<style>
	main {
		background-color: var(--sheet-bg);
		max-width: 1000px;
		margin: 0px auto;
		padding: 2rem;
	}
</style>
