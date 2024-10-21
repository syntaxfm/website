<script lang="ts">
	import { flip } from 'svelte/animate';
	import { page as pageStore } from '$app/stores';
	import { PER_PAGE } from '$const';
	import { quintOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	interface Props {
		count: number;
		perPage?: number;
		page?: number;
	}

	let { count, perPage = PER_PAGE, page = 1 }: Props = $props();
	let totalPages = $derived(Math.ceil(count / perPage));
	let generate_search_params = $derived((id: string, value: string | number) => {
		const searchParams = new URLSearchParams($pageStore.url.search);
		if (!value) {
			searchParams.delete(id);
		} else {
			searchParams.set(id, value.toString());
		}
		return searchParams.toString();
	});
	function getNeighboringNumbers(number: number, maxNumber: number): number[] {
		const start: number = Math.max(1, number - 3);
		const end: number = Math.min(maxNumber, number + 3);

		const result: number[] = Array.from({ length: end - start + 1 }, (_, index) => start + index);

		return result;
	}

	let pageNumbers = $derived(getNeighboringNumbers(page, totalPages));
</script>

<div class="pagination">
	<a title="First Page" href="?{generate_search_params('page', '')}">←←</a>
	<a href="?{generate_search_params('page', page > 1 ? page - 1 : '')}">←</a>
	{#each pageNumbers as pageNumber (pageNumber)}
		<a
			in:fade
			animate:flip={{ duration: 200, easing: quintOut }}
			class="page-number"
			class:current={page === pageNumber}
			href="?{generate_search_params('page', pageNumber)}"
			>{pageNumber}
		</a>
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
		@media (--below-large) {
			gap: 8px;
		}
		& > * {
			border-radius: var(--brad);
			margin: 0;
			box-shadow: inset 0 0 0 1px var(--subtle);
			padding: 6px 15px;
			text-align: center;
			background-color: var(--bg-1);
		}
		a {
			color: var(--fg);
			transition: 0.2s ease background;
			&.current {
				background: var(--primary);
				color: var(--dark);
			}
			@media (--below-large) {
				&.page-number:not(.current) {
					display: none;
				}
			}
		}
	}
</style>
