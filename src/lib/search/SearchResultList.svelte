<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import { search } from '$state/search.svelte';

	import type { Tree, Block } from './types';
	import type { Show } from '@prisma/client';

	interface Props {
		results: (Block & Show)[] | Tree[];
		recent_searches?: boolean;
		query: string;
		onselect: (href: string) => void;
	}

	let { results, recent_searches = false, query, onselect }: Props = $props();

	function escape(text: string) {
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function excerpt(content: string, query: string, trim: boolean = true) {
		if (content) {
			const index = content.toLowerCase().indexOf(query?.toLowerCase());
			if (index === -1) {
				return escape(content.slice(0, 100));
			}

			const prefix =
				index > 20 && trim ? `…${content.slice(index - 15, index)}` : content.slice(0, index);
			const suffix = content.slice(
				index + query.length,
				index + query.length + (80 - (prefix.length + query.length))
			);

			return (
				escape(prefix) +
				`<mark>${escape(content.slice(index, index + query.length))}</mark>` +
				escape(suffix)
			);
		}
	}

	function play_show(show_or_tree: (Block & Show) | Tree) {
		const local_show: Block & Show = is_tree(show_or_tree) ? show_or_tree.node : show_or_tree;
		player.start_show(local_show);
	}

	function is_tree(show_or_tree: (Block & Show) | Tree): show_or_tree is Tree {
		return 'node' in show_or_tree;
	}
</script>

<ul>
	{#each results as result (result.href)}
		<li>
			<!-- Show data not available in recent searches -->
			<button
				onclick={(e) => {
					e.preventDefault();
					play_show(result);
				}}
				class="play-button"
			>
				<Icon name="play" />
			</button>

			<a
				data-sveltekit-preload-data
				href={result.href}
				onclick={() => onselect(result.href)}
				data-has-node={is_tree(result) ? true : undefined}
			>
				<strong class="wrap">
					<mark>#{is_tree(result) ? result.node.number : result.number}</mark>
					{@html excerpt(result.breadcrumbs[result.breadcrumbs.length - 1], query, false)}
				</strong>

				{#if is_tree(result) && result.node?.content}
					<span class="fs-caption">{@html excerpt(result.node.content, query)}</span>
				{/if}
			</a>
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

	.play-button {
		background: var(--c-bg);
		border: 2px solid var(--c-fg);
		color: var(--c-fg);
		padding: 5px 3px 5px 5px;
		box-shadow: none;

		--icon-size: 14px;

		height: 31px;
		width: 31px;

		&:hover {
			color: var(--c-primary);
		}
	}

	ul {
		position: relative;
		margin: 0;
		padding: 0;
	}

	li {
		list-style: none;
		position: relative;
		padding: 0 10px;
		display: flex;
		align-items: center;
		overflow: hidden;
		margin-bottom: 0;
	}

	li:last-child {
		margin-bottom: 0;
	}

	a {
		display: block;
		text-decoration: none;
		line-height: 1;
		padding: 1rem;
		overflow: hidden;
	}

	li:hover {
		background: var(--c-black-1);
	}

	a strong,
	a span {
		display: block;
		white-space: nowrap;
		line-height: 1.5;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	a strong.wrap {
		white-space: normal;
	}

	a strong {
		color: var(--sk-text-2);
	}

	a span {
		color: var(--c-black-3);
		margin: 0.4rem 0 0;
	}

	a :global(mark) {
		--highlight-color: var(--c-primary);
		--sk-text-1: var(--c-black);
	}

	a span :global(mark) {
		color: var(--sk-text-1);
		background: var(--highlight-color);
		border-top: 2px solid var(--highlight-color);

		/* mix-blend-mode: darken; */
	}

	a:focus span {
		color: rgb(255 255 255 / 0.6);
	}

	a:focus strong {
		color: var(--c-white);
	}

	a:focus span :global(mark),
	a:focus strong :global(mark) {
		--highlight-color: hsl(240deg 8% 54%);

		mix-blend-mode: lighten;
		color: var(--c-white);
	}

	a strong :global(mark) {
		color: var(--sk-text-1);
		background: var(--highlight-color);

		/* border-top: 2px solid var(--highlight-color); */
		border-radius: 1px;
	}
</style>
