import { describe, expect, it } from 'vitest';
import type { ContentNode, ContentTree } from './content_tree';
import { MAX_CONTENT_DEPTH, markdown_to_content } from './markdown_to_content.server';

// Every element kind and attribute that survived conversion, as `tag[attr,...]` strings.
function element_signatures(tree: ContentTree): string[] {
	const signatures: string[] = [];
	const visit = (nodes: ContentNode[]) => {
		for (const node of nodes) {
			if (node.kind === 'text' || node.kind === 'line_break' || node.kind === 'thematic_break') {
				continue;
			}
			const { children, ...fields } = node;
			const attributes = Object.entries(fields)
				.filter(([key, value]) => key !== 'kind' && key !== 'tag' && value !== undefined)
				.map(([key]) => key);
			signatures.push(`${'tag' in node ? node.tag : node.kind}[${attributes.join(',')}]`);
			visit(children);
		}
	};
	visit(tree);
	return signatures;
}

function text_of(tree: ContentTree): string {
	return tree
		.map((node) =>
			node.kind === 'text'
				? node.value
				: node.kind === 'line_break' || node.kind === 'thematic_break'
					? ''
					: text_of(node.children)
		)
		.join('');
}

function links(tree: ContentTree): string[] {
	return tree.flatMap((node) => {
		if (node.kind === 'anchor') return [`anchor:${node.id}`, ...links(node.children)];
		if (node.kind !== 'link') return 'children' in node ? links(node.children) : [];
		const { target } = node;
		const link =
			target.type === 'fragment'
				? `#${target.fragment}`
				: target.type === 'site_path'
					? `site:${target.path}`
					: target.url;
		return [link, ...links(node.children)];
	});
}

describe('markdown_to_content', () => {
	it('keeps show-note structure: heading ids, permalink anchors, timestamps and links', () => {
		const tree = markdown_to_content(
			'## Show Notes\n\n* **[00:44](#t=00:44)** Brought to you by [Sentry](https://sentry.io/syntax).\n'
		);

		expect(tree[0]).toEqual({
			kind: 'heading',
			tag: 'h2',
			id: 'show-notes',
			children: [
				{ kind: 'text', value: 'Show Notes' },
				{
					kind: 'link',
					target: { type: 'fragment', fragment: 'show-notes' },
					aria_hidden: true,
					tab_index: -1,
					children: [
						{ kind: 'styled_inline', tag: 'span', class_name: 'icon icon-link', children: [] }
					]
				}
			]
		});
		expect(links(tree)).toEqual(['#show-notes', '#t=00:44', 'https://sentry.io/syntax']);
		expect(text_of(tree)).toContain('00:44 Brought to you by Sentry.');
	});

	it('sends links to the site through in-app navigation and keeps the rest as written', () => {
		const tree = markdown_to_content(
			[
				'[a](https://syntax.fm/show/879/fullstack-cloudflare?x=1#t=1)',
				'[b](/pages/privacy)',
				'[c](https://www.syntax.fm/x)',
				'[d](//evil.example/x)',
				'<a href="/\\evil.example/x">e</a>',
				'[f](getfresh.dev)',
				'[g](mailto:hi@syntax.fm)'
			].join(' ')
		);

		expect(links(tree)).toEqual([
			'site:/show/879/fullstack-cloudflare?x=1#t=1',
			'site:/pages/privacy',
			'https://www.syntax.fm/x',
			'//evil.example/x',
			'/\\evil.example/x',
			'getfresh.dev',
			'mailto:hi@syntax.fm'
		]);
	});

	it('keeps highlight.js classes on code and drops any other class', () => {
		const tree = markdown_to_content(
			'```js\nconst a = 1;\n```\n\n<span class="hljs-keyword visually-hidden">x</span>'
		);

		expect(element_signatures(tree)).toEqual([
			'pre[]',
			'code[class_name]',
			'span[class_name]',
			'span[class_name]',
			'p[]',
			'span[class_name]'
		]);
		const last = tree.at(-1);
		expect(last?.kind === 'plain' && last.children[0]).toEqual({
			kind: 'styled_inline',
			tag: 'span',
			class_name: 'hljs-keyword',
			children: [{ kind: 'text', value: 'x' }]
		});
	});

	it('drops scripts, styles, embeds and form controls together with their content', () => {
		const tree = markdown_to_content(
			[
				'Before',
				'<script>alert("script")</script>',
				'<style>body { display: none }</style>',
				'<iframe src="https://example.com/embed"></iframe>',
				'<object data="x.swf"></object><embed src="x.swf">',
				'<svg onload="alert(1)"><text>svg</text></svg>',
				'<math><mi>math</mi></math>',
				'<link rel="stylesheet" href="https://evil.example/x.css">',
				'<meta http-equiv="refresh" content="0;url=https://evil.example">',
				'<base href="https://evil.example/">',
				'<form action="https://evil.example"><button>Go</button><input value="x"></form>',
				'<img src="x" onerror="alert(1)">',
				'<template><p>template</p></template>',
				'<noscript>noscript</noscript>',
				'After'
			].join('\n\n')
		);

		const text = text_of(tree);
		expect(text).toContain('Before');
		expect(text).toContain('After');
		for (const hidden of ['alert', 'display', 'svg', 'math', 'Go', 'template', 'noscript']) {
			expect(text).not.toContain(hidden);
		}
		// Inline raw HTML sits in paragraphs; only those (now empty) paragraphs remain.
		expect(new Set(element_signatures(tree))).toEqual(new Set(['p[]']));
	});

	it('strips event handlers, inline styles and unknown attributes from allowed elements', () => {
		const tree = markdown_to_content(
			'<p onclick="alert(1)" style="color: red" class="x" data-x="1" id="p1">Hi <strong onmouseover="alert(1)">there</strong></p>'
		);

		expect(tree).toEqual([
			{
				kind: 'plain',
				tag: 'p',
				children: [
					{ kind: 'text', value: 'Hi ' },
					{ kind: 'plain', tag: 'strong', children: [{ kind: 'text', value: 'there' }] }
				]
			}
		]);
	});

	it.each([
		['[x](javascript:alert(1))', 'markdown link'],
		['<a href="javascript:alert(1)">x</a>', 'raw link'],
		['<a href="&#106;avascript:alert(1)">x</a>', 'entity-encoded scheme'],
		['<a href="java&#x09;script:alert(1)">x</a>', 'tab inside the scheme'],
		['<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>', 'data URL'],
		['<a href="vbscript:msgbox(1)">x</a>', 'vbscript URL']
	])('reduces a %s (%s) to its text', (markdown) => {
		const tree = markdown_to_content(markdown);

		expect(links(tree)).toEqual([]);
		expect(text_of(tree)).toBe('x');
	});

	it('keeps legacy name anchors as jump targets and drops unsafe heading ids', () => {
		const tree = markdown_to_content(
			'#### Cookies <a name="cookies"></a>\n\n<h2 id="x onmouseover=alert(1)">Bad id</h2>'
		);

		expect(links(tree)).toContain('anchor:cookies');
		const bad_heading = tree.find((node) => node.kind === 'heading' && node.tag === 'h2');
		expect(bad_heading?.kind === 'heading' && bad_heading.id).toBeUndefined();
	});

	it('unwraps tag names typed in prose instead of hiding the text after them', () => {
		const tree = markdown_to_content(
			'* `p`, pick <commit> = use commit\n* Accordion with <details> and <meter> text'
		);

		expect(text_of(tree)).toContain('pick  = use commit');
		expect(text_of(tree)).toContain('Accordion with  and  text');
		expect(element_signatures(tree)).toEqual(['ul[]', 'li[]', 'code[]', 'li[]']);
	});

	it('keeps table cells with row and column spans', () => {
		const tree = markdown_to_content(
			'<table class="x"><tbody><tr class="odd"><td rowspan="6" onclick="x()">a</td><td colspan="2">b</td></tr></tbody></table>'
		);

		expect(element_signatures(tree)).toEqual([
			'table[]',
			'tbody[]',
			'tr[]',
			'td[row_span]',
			'td[col_span]'
		]);
	});

	it('flattens nesting deeper than the bound into text', () => {
		const levels = MAX_CONTENT_DEPTH + 20;
		const tree = markdown_to_content(`${'<b>'.repeat(levels)}deep${'</b>'.repeat(levels)}`);

		const depth = (nodes: ContentTree): number =>
			Math.max(0, ...nodes.map((node) => ('children' in node ? 1 + depth(node.children) : 0)));
		expect(depth(tree)).toBeLessThanOrEqual(MAX_CONTENT_DEPTH);
		expect(text_of(tree)).toBe('deep');
	});
});
