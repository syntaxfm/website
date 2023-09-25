<script lang="ts">
	import SearchResultList from './SearchResultList.svelte';
	import { Tree } from './types';

	export let results: Tree[];
	export let query: string;
</script>

{#if results.length > 0}
	<SearchResultList {results} {query} on:select />
{:else if query}
	<p class="info">No results</p>
{/if}

<style lang="postcss">
	.info {
		padding: 1rem;
		font-size: 1.2rem;
		font-weight: normal;
		text-transform: uppercase;
		background-color: var(--sk-back-2);
		border-radius: 0 0 var(--sk-border-radius) var(--sk-border-radius);
		pointer-events: all;
		margin: 0;
	}
</style>
