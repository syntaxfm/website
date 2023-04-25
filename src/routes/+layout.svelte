<script lang="ts">
	import Header from './Header.svelte';
	import './style.css';
</script>

<Header />

<main>
	<slot />
</main>

<style>
	main {
		background-color: var(--sheet-bg);
	}
</style>
