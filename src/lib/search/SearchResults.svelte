<script lang="ts">
	import SearchResultList from './SearchResultList.svelte';
	import type { Tree } from './types';

	interface Props {
		results: Tree[];
		query: string;
	}

	let { results, query }: Props = $props();
</script>

{#if results.length > 0}
	<SearchResultList {results} {query} on:select />
{:else if query}
	<p class="info fst-400">No results</p>
{/if}

<style lang="postcss">
	.info {
		padding: 1rem;
		font-size: 1.2rem;
		text-transform: uppercase;
		background-color: var(--sk-back-2);
		border-radius: 0 0 var(--sk-border-radius) var(--sk-border-radius);
		pointer-events: all;
		margin: 0;
	}
</style>
