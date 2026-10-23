<script lang="ts">
	import { browser } from '$app/environment';
	import Search from '$lib/search/Search.svelte';
	import SearchBox from '$lib/search/SearchBox.svelte';
</script>

{#if browser}
	<Search />
	<SearchBox />
{/if}
