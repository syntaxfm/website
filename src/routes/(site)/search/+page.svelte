<script lang="ts">
	import { browser } from '$app/env';
	import Search from '#lib/search/Search.svelte';
	import SearchBox from '#lib/search/SearchBox.svelte';
</script>

{#if browser}
	<Search />
	<SearchBox />
{/if}
