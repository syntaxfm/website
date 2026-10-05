<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShowNotes from './ShowNotes.svelte';
	import type { ContentNode, ContentTree } from '$lib/content/content_tree';

	const { Story } = defineMeta({
		title: 'Shows/ShowNotes',
		component: ShowNotes
	});

	const text = (value: string): ContentNode => ({ kind: 'text', value });
	const link = (url: string, label: string): ContentNode => ({
		kind: 'link',
		target: { type: 'external', url },
		children: [text(label)]
	});
	const fragment_link = (fragment: string, label: string): ContentNode => ({
		kind: 'link',
		target: { type: 'fragment', fragment },
		children: [text(label)]
	});
	const heading = (id: string, label: string): ContentNode => ({
		kind: 'heading',
		tag: 'h3',
		id,
		children: [
			text(label),
			{
				kind: 'link',
				target: { type: 'fragment', fragment: id },
				aria_hidden: true,
				tab_index: -1,
				children: [{ kind: 'styled_inline', tag: 'span', class_name: 'icon icon-link', children: [] }]
			}
		]
	});
	const timestamp = (time: string, ...rest: ContentNode[]): ContentNode => ({
		kind: 'plain',
		tag: 'li',
		children: [{ kind: 'plain', tag: 'strong', children: [fragment_link(`t=${time}`, time)] }, ...rest]
	});

	const show_notes: ContentTree = [
		{
			kind: 'plain',
			tag: 'p',
			children: [
				text(
					'Scott walks Wes through the new Syntax Production Assistant Desktop App, designed to streamline and automate their complex publishing process. From tech stack choices like Svelte5 and Rust to AI-driven features, they dive into how this tool keeps everything consistent.'
				)
			]
		},
		text('\n'),
		heading('show-notes', 'Show Notes'),
		text('\n'),
		{
			kind: 'plain',
			tag: 'ul',
			children: [
				text('\n'),
				timestamp('00:00', text(' Welcome to Syntax!')),
				text('\n'),
				timestamp('00:44', text(' Brought to you by '), link('https://sentry.io/syntax', 'Sentry.io'), text('.')),
				text('\n'),
				timestamp(
					'05:42',
					text(' The tech.\n'),
					{
						kind: 'plain',
						tag: 'ul',
						children: [
							text('\n'),
							{
								kind: 'plain',
								tag: 'li',
								children: [
									link('https://svelte.dev/blog/svelte-5-release-candidate', 'Svelte5'),
									text(', '),
									link('https://tauri.app/', 'Tauri'),
									text(', '),
									link('https://www.rust-lang.org/', 'Rust'),
									text('.')
								]
							},
							text('\n')
						]
					},
					text('\n')
				),
				text('\n'),
				timestamp('16:26', text(' Challenges with '), link('https://oauth.net/2/', 'OAuth'), text('.')),
				text('\n')
			]
		},
		text('\n'),
		heading('hit-us-up-on-socials', 'Hit us up on Socials!'),
		text('\n'),
		{
			kind: 'plain',
			tag: 'p',
			children: [
				text('Syntax: '),
				link('https://twitter.com/syntaxfm', 'X'),
				text(' '),
				link('https://www.instagram.com/syntax_fm/', 'Instagram'),
				text(' '),
				link('https://www.tiktok.com/@syntaxfm', 'Tiktok')
			]
		}
	];
</script>

<Story name="Default" args={{ show_notes }} />
