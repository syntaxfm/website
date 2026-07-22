<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import DateTimePicker from './DateTimePicker.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Date Time Picker',
		component: DateTimePicker
	});
</script>

<Story name="Default" args={{ onchange: fn() }}>
	{#snippet template(args)}
		<div class="admin">
			<DateTimePicker {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Scheduled"
	args={{
		value: new Date(2026, 6, 21, 9, 30),
		label: 'Scheduled publication date and time',
		onchange: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<DateTimePicker {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Without Clear"
	args={{
		value: new Date(2026, 11, 31, 23, 45),
		label: 'Embargo ends',
		show_clear: false,
		onchange: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<DateTimePicker {...args} />
		</div>
	{/snippet}
</Story>
