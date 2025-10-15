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
	<p class="info fv-400">No results</p>
{/if}

<style lang="postcss">
	.info {
		padding: 1rem;
		font-size: var(--fs-2);
		text-transform: uppercase;
		background-color: var(--c-bg);
		border-radius: 0 0 var(--br-medium) var(--br-medium);
		pointer-events: all;
		margin: 0;
	}
</style>
