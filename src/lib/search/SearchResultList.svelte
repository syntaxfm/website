<script lang="ts">
	import ShowCard from '$lib/shows/Show.svelte';
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

<ul>
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
					class="button-reset remove-from-recent"
					onclick={(e) => {
						search.search_recent.value = search.search_recent.value.filter(
							(href) => href !== result.href
						);
						e.stopPropagation();
						e.preventDefault();
					}}
				>
					×
				</button>
			{/if}
		</li>
	{/each}
</ul>

<style lang="postcss">
	.remove-from-recent {
		color: var(--c-red);
		position: absolute;
		right: -10px;
		top: 50%;
		transform: translateY(-50%);
	}

	ul {
		margin: 0;
		padding: 0;
	}

	li {
		list-style: none;
		position: relative;
		padding: 0 10px;
		margin-bottom: 0;
	}

	li :global(.show-link) {
		text-decoration: none;
	}

	li :global(.show-list-view) {
		padding: 8px;
	}

	li :global(.show-list-view h3) {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	li:hover :global(.show-list-view) {
		background: var(--c-black-1);
	}
</style>
