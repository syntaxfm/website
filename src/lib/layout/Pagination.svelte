<script lang="ts">
	import { flip } from 'svelte/animate';
	import { page as pageStore } from '$app/state';
	import { PER_PAGE } from '$const';
	import { quintOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	interface Props {
		count: number;
		perPage?: number;
		page?: number;
	}

	$effect(() => {
		console.log('pageStore.url.search', pageStore.url);
	});

	let { count, perPage = PER_PAGE, page = 1 }: Props = $props();
	let totalPages = $derived(Math.ceil(count / perPage));
	let generate_search_params = $derived((id: string, value: string | number) => {
		const searchParams = new URLSearchParams(pageStore.url.search);

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

<div class="pagination-container">
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
</div>

<style lang="postcss">
	.pagination-container {
		display: flex;
		justify-content: center;
	}

	.pagination {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		justify-content: center;
		border: solid 2px var(--c-fg);
		border-radius: var(--br-medium);

		& > * {
			margin: 0;
			padding: 10px 20px;
			text-align: center;
		}

		a {
			color: var(--c-fg);
			transition: 0.2s ease background;
			font-variation-settings: var(--fv-700-italic);

			& + & {
				border-left: solid 2px var(--c-fg);
			}

			&.current {
				background: var(--c-primary);
				color: var(--c-black);
			}

			@media (--below-large) {
				&.page-number:not(.current) {
					display: none;
				}
			}
		}
	}
</style>
