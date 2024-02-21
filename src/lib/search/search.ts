import type { Show } from '@prisma/client';
import flexsearch from 'flexsearch';
import type { Block, Tree } from './types';

const Index = flexsearch.Index ?? flexsearch;

export let inited = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let indexes: any[];

const map: Map<string, Block> = new Map();

const hrefs: Map<string, string> = new Map();

export function init(blocks: Block[]) {
	if (inited) return;

	// we have multiple indexes, so we can rank sections (migration guide comes last)
	const max_rank = Math.max(...blocks.map((block) => block.rank ?? 0));

	indexes = Array.from({ length: max_rank + 1 }, () => new Index({ tokenize: 'forward' }));

	for (const block of blocks) {
		const title = block.breadcrumbs.at(-1);
		map.set(block.href, block);
		// NOTE: we're not using a number as the ID here, but it is recommended:
		// https://github.com/nextapps-de/flexsearch#use-numeric-ids
		// If we were to switch to a number we would need a second map from ID to block
		// We need to keep the existing one to allow looking up recent searches by URL even if docs change
		// It's unclear how much browsers do string interning and how this might affect memory
		// We'd probably want to test both implementations across browsers if memory usage becomes an issue
		// https://github.com/nextapps-de/flexsearch/pull/364 is merged and released
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		indexes[block.rank ?? 0].add(block.href, `${title} ${block.content}`);

		hrefs.set(block.breadcrumbs.join('::'), block.href);
	}

	inited = true;
}

export function search(query: string) {
	const escaped = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	const regex = new RegExp(`(^|\\b)${escaped}`, 'i');

	const blocks = indexes
		.flatMap((index) => index.search(query))
		.map(lookup)
		.map((block, rank) => ({ block, rank }))
		.sort((a, b) => {
			const a_title_matches = regex.test((a?.block?.breadcrumbs.at(-1) || '') as string);
			const b_title_matches = regex.test((b?.block?.breadcrumbs.at(-1) || '') as string);

			// massage the order a bit, so that title matches
			// are given higher priority
			if (a_title_matches !== b_title_matches) {
				return a_title_matches ? -1 : 1;
			}

			return (
				(a?.block?.breadcrumbs.length || 0) - (b?.block?.breadcrumbs.length || 0) || a.rank - b.rank
			);
		})
		.map(({ block }) => {
			return {
				...block,
				content: block?.content
					// strip markdown braces but preserve the link text as well as the link, delimited by a hyphen
					.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 - $2')
			};
		}) as (Block & Show)[];

	const results = tree([], blocks).children;

	return results;
}

export function lookup(href: string) {
	return map.get(href);
}

function tree(breadcrumbs: string[], blocks: (Block & Show)[]): Tree {
	const depth = breadcrumbs.length;

	const node = blocks.find((block) => {
		if (block.breadcrumbs.length !== depth) return false;
		return breadcrumbs.every((part, i) => block.breadcrumbs[i] === part);
	}) as Block & Show;

	const descendants = blocks.filter((block) => {
		if (block.breadcrumbs.length <= depth) return false;
		return breadcrumbs.every((part, i) => block.breadcrumbs[i] === part);
	});

	const child_parts = Array.from(new Set(descendants.map((block) => block.breadcrumbs[depth])));

	return {
		breadcrumbs,
		href: hrefs.get(breadcrumbs.join('::')) || '',
		node,
		children: child_parts.map((part) => tree([...breadcrumbs, part], descendants))
	};
}
