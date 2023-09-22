<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import { search_recent } from '$state/search';
	import { createEventDispatcher } from 'svelte';
	import type { Tree, Block } from './types';
	import { Show } from '@prisma/client';

	export let results: (Block & Show)[] | Tree[];
	export let recent_searches: boolean = false;
	export let query: string;

	const dispatch = createEventDispatcher();

	function escape(text: string) {
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function excerpt(content: string, query: string) {
		if (content) {
			const index = content.toLowerCase().indexOf(query?.toLowerCase());
			if (index === -1) {
				return escape(content.slice(0, 100));
			}

			const prefix = index > 20 ? `…${content.slice(index - 15, index)}` : content.slice(0, index);
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
		player.play_show(local_show);
	}

	function is_tree(show_or_tree: (Block & Show) | Tree): show_or_tree is Tree {
		return 'node' in show_or_tree;
	}
</script>

<ul>
	{#each results as result (result.href)}
		<li>
			<!-- Show data not available in recent searches -->
			<button on:click|preventDefault={() => play_show(result)} class="play-button">
				<Icon name="play" />
			</button>

			<a
				data-sveltekit-preload-data
				href={result.href}
				on:click={() => dispatch('select', { href: result.href })}
				data-has-node={is_tree(result) ? true : undefined}
			>
				<strong>{@html excerpt(result.breadcrumbs[result.breadcrumbs.length - 1], query)}</strong>

				{#if is_tree(result) && result.node?.content}
					<span class="text-sm">{@html excerpt(result.node.content, query)}</span>
				{/if}
			</a>
			{#if recent_searches}
				<button
					aria-label="Delete"
					class="button-reset remove-from-recent"
					on:click={(e) => {
						$search_recent = $search_recent.filter((href) => href !== result.href);
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
		color: var(--warning);
		position: absolute;
		right: -10px;
		top: 50%;
		transform: translateY(-50%);
	}

	.play-button {
		background: transparent;
		color: var(--fg);
		padding: 5px;
		box-shadow: none;
		--icon_size: 22px;
		&:hover {
			color: var(--accent);
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
		background: var(--zebra);
	}

	a strong,
	a span {
		display: block;
		white-space: nowrap;
		line-height: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	a strong {
		color: var(--sk-text-2);
	}

	a span {
		color: #737373;
		margin: 0.4rem 0 0 0;
	}

	a :global(mark) {
		--highlight-color: var(--primary);
		--sk-text-1: var(--black);
	}

	a span :global(mark) {
		background: none;
		color: var(--sk-text-1);
		background: var(--highlight-color);
		border-top: 2px solid var(--highlight-color);
		/* mix-blend-mode: darken; */
	}

	a:focus span {
		color: rgba(255, 255, 255, 0.6);
	}

	a:focus strong {
		color: white;
	}

	a:focus span :global(mark),
	a:focus strong :global(mark) {
		--highlight-color: hsl(240, 8%, 54%);
		mix-blend-mode: lighten;
		color: white;
	}

	a strong :global(mark) {
		color: var(--sk-text-1);
		background: var(--highlight-color);
		/* border-top: 2px solid var(--highlight-color); */
		border-radius: 1px;
	}
</style>
