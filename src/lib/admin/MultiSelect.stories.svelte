<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import MultiSelect from './MultiSelect.svelte';

	const options = [
		{ id: 'svelte', name: 'Svelte' },
		{ id: 'typescript', name: 'TypeScript' },
		{ id: 'accessibility', name: 'Accessibility and inclusive interface design' },
		{ id: 'performance', name: 'Web performance, profiling, and Core Web Vitals' },
		{ id: 'testing', name: 'Browser and component testing' }
	];
	const bounded_options = Array.from({ length: 120 }, (_, option_index) => {
		const option_number = option_index + 1;

		return {
			id: `topic-${option_number}`,
			name: `Topic ${option_number.toString().padStart(3, '0')}`
		};
	});

	const { Story } = defineMeta({
		title: 'Admin/Multi Select',
		component: MultiSelect
	});
</script>

<Story
	name="Default"
	args={{ options, label: 'Topics', placeholder: 'Search topics', onchange: fn() }}
	play={async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const combobox = canvas.getByRole('combobox', { name: 'Topics' });
		await userEvent.click(combobox);
		const option = canvas.getByRole('option', { name: 'Svelte' });
		await expect(option).toHaveAttribute('tabindex', '-1');
		await userEvent.click(option);
		await expect(combobox).toHaveFocus();
		await expect(args.onchange).toHaveBeenCalledWith(['svelte']);
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Bounded Results"
	args={{
		options: bounded_options,
		label: 'Many topics',
		placeholder: 'Search 120 topics',
		onchange: fn()
	}}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('combobox', { name: 'Many topics' }));
		await expect(canvas.getAllByRole('option')).toHaveLength(50);
		await expect(canvas.getByRole('status')).toHaveTextContent('70 more matches');
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Selected"
	args={{
		options,
		selected_ids: ['svelte', 'accessibility', 'performance'],
		label: 'Selected topics with long labels',
		onchange: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Disabled"
	args={{
		options,
		selected_ids: ['typescript', 'testing'],
		disabled: true,
		onchange: fn()
	}}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('combobox')).toBeDisabled();
		await expect(canvas.getByRole('button', { name: 'Remove TypeScript' })).toBeDisabled();
		await expect(
			canvas.getByRole('button', { name: 'Remove Browser and component testing' })
		).toBeDisabled();
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<MultiSelect {...args} />
		</div>
	{/snippet}
</Story>
