<script lang="ts">
	import { flip } from 'svelte/animate';
	import { page as pageStore } from '$app/stores';
	import { PER_PAGE } from '$const';
	import { quintOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	export let count: number;
	export let perPage: number = PER_PAGE;
	export let page: number = 1;
	let totalPages = Math.ceil(count / perPage);
	$: generate_search_params = (id: string, value: string | number) => {
		const searchParams = new URLSearchParams($pageStore.url.search);
		if (!value) {
			searchParams.delete(id);
		} else {
			searchParams.set(id, value.toString());
		}
		return searchParams.toString();
	};
	function getNeighboringNumbers(number: number, maxNumber: number): number[] {
		const start: number = Math.max(1, number - 3);
		const end: number = Math.min(maxNumber, number + 3);

		const result: number[] = Array.from({ length: end - start + 1 }, (_, index) => start + index);

		return result;
	}

	$: pageNumbers = getNeighboringNumbers(page, totalPages);
</script>

<div class="pagination">
	<a title="First Page" href="?{generate_search_params('page', '')}">←←</a>
	<a href="?{generate_search_params('page', page > 1 ? page - 1 : '')}">←</a>
	{#each pageNumbers as pageNumber (pageNumber)}
		<a
			in:fade
			animate:flip={{ duration: 200, easing: quintOut }}
			class={page === pageNumber ? 'current' : ''}
			href="?{generate_search_params('page', pageNumber)}">{pageNumber}</a
		>
	{/each}
	<a href="?{generate_search_params('page', page + 1)}">→</a>
	<a title="Last Page" href="?{generate_search_params('page', totalPages)}">→→</a>
</div>

<style lang="postcss">
	.pagination {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		gap: 20px;
		justify-content: center;
		& > * {
			border-radius: var(--brad);
			margin: 0;
			box-shadow: inset 0 0 0 1px oklch(var(--blacklch) / 0.05);
			padding: 6px 15px;
			text-align: center;
			background-color: var(--bg-1);
		}
		a {
			color: var(--fg);
			transition: 0.2s ease background;
			&.current {
				background: var(--primary);
			}
		}
	}
</style>
