<script lang="ts">
	import ShowCard from '#lib/shows/Show.svelte';
	import Icon from '#lib/Icon.svelte';
	import { search } from '$state/search.svelte';
	import type { SearchShow } from './types';
	import { get_show_label } from '#lib/shows/show_label.ts';

	interface Props {
		results: SearchShow[];
		recent_searches?: boolean;
		onselect: (href: string) => void;
	}

	let { results, recent_searches = false, onselect }: Props = $props();
</script>

<ul class="stack" class:recent={recent_searches}>
	{#each results as result (result.href)}
		<li>
			<ShowCard
				show={{ ...result, show: get_show_label(result) }}
				type="list"
				href={result.href}
				onselect={() => onselect(result.href)}
				data_has_node={!recent_searches}
				preload_data={true}
			/>
			{#if recent_searches}
				<button
					aria-label="Delete"
					class="remove-from-recent"
					onclick={(e) => {
						search.search_recent.value = search.search_recent.value.filter(
							(href) => href !== result.href
						);
						e.stopPropagation();
						e.preventDefault();
					}}
				>
					<Icon name="close" height={18} width={18} />
				</button>
			{/if}
		</li>
	{/each}
</ul>

<style lang="postcss">
	.remove-from-recent {
		color: var(--c-red);
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		background: none;
		border: none;
		border-radius: 0;
		cursor: pointer;
	}

	.remove-from-recent:hover {
		background: none;
		opacity: 0.7;
	}

	ul {
		--stack-gap: 6px;

		margin: 0;
		padding: 0;
	}

	li {
		list-style: none;
		position: relative;
		margin-bottom: 0;
	}

	li :global(.show-link) {
		text-decoration: none;
	}

	li :global(.show-list-view) {
		padding: 8px;
	}

	/* Let the text column shrink so long titles truncate instead of overflowing */
	li :global(.show-list-view > .stack) {
		min-width: 0;
	}

	/* Keep the thumbnail a consistent size — don't let long titles shrink it */
	li :global(.show-list-view .thumbnail-wrap) {
		flex-shrink: 0;
	}

	/* Reserve room for the delete button on recent rows so titles don't slide under it */
	.recent li :global(.show-list-view) {
		padding-right: 40px;
	}

	li :global(.show-list-view h3) {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Keep meta values whole — wrap as chunks rather than breaking mid-value */
	li :global(.show-list-view .stack .flex) {
		flex-wrap: wrap;
	}

	li :global(.show-list-view .stack .flex p) {
		white-space: nowrap;
	}

	li:hover :global(.show-list-view) {
		background: var(--c-black-1);
	}
</style>
