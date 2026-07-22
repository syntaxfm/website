<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import SlugEditor from './SlugEditor.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Slug Editor',
		component: SlugEditor
	});
</script>

<Story name="Default" args={{ title: 'Modern CSS Layout Techniques', onchange: fn() }}>
	{#snippet template(args)}
		<div class="admin">
			<SlugEditor {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Custom Slug"
	args={{
		title: 'A Very Long Show Title About Building Resilient Web Applications at Scale',
		slug: 'resilient-web-apps',
		label: 'Public URL slug',
		onchange: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<SlugEditor {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Custom Without Regenerate"
	args={{
		title: 'An Imported Article with a Preserved URL',
		slug: 'legacy-article-url',
		show_regenerate: false,
		onchange: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<SlugEditor {...args} />
		</div>
	{/snippet}
</Story>
