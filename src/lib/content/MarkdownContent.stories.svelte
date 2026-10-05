<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MarkdownContent from './MarkdownContent.svelte';
	import type { ContentNode, ContentTree } from './content_tree';

	const { Story } = defineMeta({
		title: 'Content/MarkdownContent',
		component: MarkdownContent
	});

	const text = (value: string): ContentNode => ({ kind: 'text', value });

	// The shape `markdown_to_content` produces for a heading, a timestamp list, code and a table.
	const content: ContentTree = [
		{
			kind: 'heading',
			tag: 'h2',
			id: 'show-notes',
			children: [
				text('Show Notes'),
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
		},
		{
			kind: 'plain',
			tag: 'ul',
			children: [
				{
					kind: 'plain',
					tag: 'li',
					children: [
						{
							kind: 'plain',
							tag: 'strong',
							children: [
								{
									kind: 'link',
									target: { type: 'fragment', fragment: 't=00:00' },
									children: [text('00:00')]
								}
							]
						},
						text(' Welcome to Syntax!')
					]
				},
				{
					kind: 'plain',
					tag: 'li',
					children: [
						{
							kind: 'plain',
							tag: 'strong',
							children: [
								{
									kind: 'link',
									target: { type: 'fragment', fragment: 't=00:44' },
									children: [text('00:44')]
								}
							]
						},
						text(' Brought to you by '),
						{
							kind: 'link',
							target: { type: 'external', url: 'https://sentry.io/syntax' },
							children: [text('Sentry.io')]
						},
						text('.')
					]
				}
			]
		},
		{
			kind: 'plain',
			tag: 'p',
			children: [
				text('Install it with '),
				{ kind: 'styled_inline', tag: 'code', children: [text('npm i -g @sanity/cli')] },
				text('.')
			]
		},
		{
			kind: 'plain',
			tag: 'pre',
			children: [
				{
					kind: 'styled_inline',
					tag: 'code',
					class_name: 'hljs language-js',
					children: [
						{
							kind: 'styled_inline',
							tag: 'span',
							class_name: 'hljs-keyword',
							children: [text('const')]
						},
						text(' answer = '),
						{
							kind: 'styled_inline',
							tag: 'span',
							class_name: 'hljs-number',
							children: [text('42')]
						},
						text(';\n')
					]
				}
			]
		},
		{
			kind: 'plain',
			tag: 'table',
			children: [
				{
					kind: 'plain',
					tag: 'tbody',
					children: [
						{
							kind: 'plain',
							tag: 'tr',
							children: [
								{ kind: 'cell', tag: 'td', children: [text('Identifiers')] },
								{ kind: 'cell', tag: 'td', row_span: 2, children: [text('Operate the Service')] }
							]
						},
						{
							kind: 'plain',
							tag: 'tr',
							children: [{ kind: 'cell', tag: 'td', children: [text('Usage data')] }]
						}
					]
				}
			]
		}
	];
</script>

<Story name="Default" args={{ content }} />
