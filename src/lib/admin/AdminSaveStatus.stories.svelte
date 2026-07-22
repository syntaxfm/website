<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import AdminSaveStatus from './AdminSaveStatus.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Save Status',
		component: AdminSaveStatus
	});
</script>

<Story name="Idle" args={{ state: 'idle' }}>
	{#snippet template(args)}
		<div class="admin">
			<AdminSaveStatus {...args} />
		</div>
	{/snippet}
</Story>
<Story name="Dirty" args={{ state: 'dirty' }}>
	{#snippet template(args)}
		<div class="admin">
			<AdminSaveStatus {...args} />
		</div>
	{/snippet}
</Story>
<Story name="Saving" args={{ state: 'saving' }}>
	{#snippet template(args)}
		<div class="admin">
			<AdminSaveStatus {...args} />
		</div>
	{/snippet}
</Story>
<Story name="Saved" args={{ state: 'saved' }}>
	{#snippet template(args)}
		<div class="admin">
			<AdminSaveStatus {...args} />
		</div>
	{/snippet}
</Story>
<Story
	name="Error"
	args={{
		state: 'error',
		error_message: 'Unable to save changes.',
		onretry: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminSaveStatus {...args} />
		</div>
	{/snippet}
</Story>
