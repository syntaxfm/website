<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import AdminConfirmDialog from './AdminConfirmDialog.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Confirm Dialog',
		component: AdminConfirmDialog
	});
</script>

<script lang="ts">
	let is_removable_dialog_visible = $state(true);
</script>

<Story
	name="Default"
	args={{
		title: 'Delete article?',
		description: 'This permanently deletes the article and cannot be undone.',
		confirm_phrase: 'DELETE',
		action_label: 'Delete article',
		trigger_label: 'Open delete confirmation',
		onconfirm: fn()
	}}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('button', { name: 'Open delete confirmation' });
		await userEvent.click(trigger);
		await userEvent.type(canvas.getByLabelText(/Type DELETE to confirm/), 'DELETE');
		await expect(canvas.getByRole('button', { name: 'Delete article' })).toBeEnabled();
		await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(trigger).toHaveFocus());
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminConfirmDialog {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Successful Action Focus Fallback"
	args={{
		title: 'Archive article?',
		description: 'This removes the article from the active collection.',
		confirm_phrase: 'ARCHIVE',
		action_label: 'Archive article',
		trigger_label: 'Open archive confirmation',
		onconfirm: fn()
	}}
	play={async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Open archive confirmation' }));
		await userEvent.type(canvas.getByLabelText(/Type ARCHIVE to confirm/), 'ARCHIVE');
		await userEvent.click(canvas.getByRole('button', { name: 'Archive article' }));
		await waitFor(() => expect(args.onconfirm).toHaveBeenCalledOnce());
		await waitFor(() =>
			expect(canvas.getByRole('heading', { name: 'Article settings' })).toHaveFocus()
		);
	}}
>
	{#snippet template(args)}
		<main class="admin">
			<h1>Article settings</h1>
			{#if is_removable_dialog_visible}
				<AdminConfirmDialog
					{...args}
					onconfirm={async () => {
						await args.onconfirm();
						is_removable_dialog_visible = false;
					}}
				/>
			{/if}
		</main>
	{/snippet}
</Story>

<Story
	name="Custom Phrase"
	args={{
		title: 'Permanently remove this unusually long editorial record?',
		description:
			'This removes the record, its publishing history, and all associated metadata. This action cannot be undone.',
		confirm_phrase: 'REMOVE RECORD',
		action_label: 'Permanently remove record',
		trigger_label: 'Remove editorial record',
		onconfirm: fn()
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminConfirmDialog {...args} />
		</div>
	{/snippet}
</Story>
