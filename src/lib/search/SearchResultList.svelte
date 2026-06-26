<script lang="ts">
	import ShowCard from '$lib/shows/Show.svelte';
	import Icon from '$lib/Icon.svelte';
	import type { Show as DbShow } from '$server/db/types';
	import { search } from '$state/search.svelte';
	import type { Tree, Block } from './types';

	interface Props {
		results: (Block & DbShow)[] | Tree[];
		recent_searches?: boolean;
		onselect: (href: string) => void;
	}

	let { results, recent_searches = false, onselect }: Props = $props();

	function is_tree(show_or_tree: (Block & DbShow) | Tree): show_or_tree is Tree {
		return 'node' in show_or_tree;
	}

	function to_show(show_or_tree: (Block & DbShow) | Tree) {
		const local_show: Block & DbShow = is_tree(show_or_tree) ? show_or_tree.node : show_or_tree;
		const show_name =
			'show' in local_show && typeof local_show.show === 'string'
				? local_show.show
				: 'Syntax Podcast';
		const show_thumbnail =
			'thumbnail' in local_show && typeof local_show.thumbnail === 'string'
				? local_show.thumbnail
				: null;

		return {
			title: local_show.title,
			date: local_show.date,
			show: show_name,
			thumbnail: show_thumbnail,
			youtube_url: local_show.youtube_url,
			number: local_show.number,
			slug: local_show.slug
		};
	}
</script>

<ul class="stack" class:recent={recent_searches}>
	{#each results as result (result.href)}
		<li>
			<ShowCard
				show={to_show(result)}
				type="list"
				href={result.href}
				onselect={() => onselect(result.href)}
				data_has_node={is_tree(result)}
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
