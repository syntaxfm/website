<script lang="ts">
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';
	import './style.css';
</script>

<Header />

<main>
	<slot />
</main>

<Footer />

<style>
	main {
		background-color: var(--sheet-bg);
		max-width: 1000px;
		margin: 0px auto;
		padding: 2rem;
	}
</style>
