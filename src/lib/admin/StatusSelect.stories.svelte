<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import StatusSelect from './StatusSelect.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Status Select',
		component: StatusSelect
	});
</script>

<Story name="Default" args={{ onchange: fn() }}>
	{#snippet template(args)}
		<div class="admin">
			<StatusSelect {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Selected"
	args={{ status: 'PUBLISHED', label: 'Editorial publication status', onchange: fn() }}
>
	{#snippet template(args)}
		<div class="admin">
			<StatusSelect {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{ status: 'ARCHIVED', disabled: true, onchange: fn() }}>
	{#snippet template(args)}
		<div class="admin">
			<StatusSelect {...args} />
		</div>
	{/snippet}
</Story>
