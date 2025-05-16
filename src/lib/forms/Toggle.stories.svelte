<script module>
	import { expect, userEvent, within } from 'storybook/test';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Toggle from './Toggle.svelte';

	const { Story } = defineMeta({
		title: 'Forms/Toggle',
		component: Toggle
	});
</script>

<Story
	name="Default"
	args={{
		label: 'Toggle',
		checked: true,
		on_icon: 'grid',
		off_icon: 'list'
	}}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByTestId('toggle-off'));
		await expect(canvas.getByTestId('toggle-off')).toHaveClass('active');
		await expect(canvas.getByTestId('toggle-on')).not.toHaveClass('active');
		await userEvent.click(canvas.getByTestId('toggle-on'));
		await expect(canvas.getByTestId('toggle-on')).toHaveClass('active');
		await expect(canvas.getByTestId('toggle-off')).not.toHaveClass('active');
	}}
/>
