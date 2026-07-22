<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import MarkdownEditor from './MarkdownEditor.svelte';

	const markdown = `## Shipping resilient Svelte apps

Use **progressive enhancement** and test the paths your users depend on.

- Keep interactions accessible
- Measure real-world performance
- [Read the Svelte documentation](https://svelte.dev/docs)`;

	const { Story } = defineMeta({
		title: 'Admin/Markdown Editor',
		component: MarkdownEditor
	});
</script>

<Story name="Default" args={{ value: '', label: 'Show notes', rows: 10, onchange: fn() }}>
	{#snippet template(args)}
		<div class="admin">
			<MarkdownEditor {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Content and Preview"
	args={{ value: markdown, label: 'Article body', rows: 12, onchange: fn() }}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('tab', { name: 'Preview' }));
		await expect(canvas.getByTitle('Markdown preview')).toBeInTheDocument();
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<MarkdownEditor {...args} />
		</div>
	{/snippet}
</Story>
