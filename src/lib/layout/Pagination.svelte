<script lang="ts">
	import { flip } from 'svelte/animate';
	import { page as pageStore } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { PER_PAGE } from '$const';
	import { quintOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	interface Props {
		count: number;
		per_page?: number;
		page?: number;
	}

	let { count, per_page = PER_PAGE, page = 1 }: Props = $props();
	let total_pages = $derived(Math.ceil(count / per_page));
	let generate_search_params = $derived((id: string, value: string | number): ResolvedPathname => {
		const search_params = new URLSearchParams(pageStore.url.search);

		if (!value) {
			search_params.delete(id);
		} else {
			search_params.set(id, value.toString());
		}
		const query = search_params.toString();
		return (
			query ? `${pageStore.url.pathname}?${query}` : pageStore.url.pathname
		) as ResolvedPathname;
	});
	function getNeighboringNumbers(number: number, maxNumber: number): number[] {
		const start: number = Math.max(1, number - 3);
		const end: number = Math.min(maxNumber, number + 3);

		const result: number[] = Array.from({ length: end - start + 1 }, (_, index) => start + index);

		return result;
	}

	let page_numbers = $derived(getNeighboringNumbers(page, total_pages));
</script>

<div class="pagination-container">
	<div class="pagination">
		<a title="First Page" href={generate_search_params('page', '')}>←←</a>
		<a href={generate_search_params('page', page > 1 ? page - 1 : '')}>←</a>
		{#each page_numbers as pageNumber (pageNumber)}
			<a
				in:fade
				animate:flip={{ duration: 200, easing: quintOut }}
				class="page-number"
				class:current={page === pageNumber}
				href={generate_search_params('page', pageNumber)}
				>{pageNumber}
			</a>
		{/each}
		<a href={generate_search_params('page', page + 1)}>→</a>
		<a title="Last Page" href={generate_search_params('page', total_pages)}>→→</a>
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
