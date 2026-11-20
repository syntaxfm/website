<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import IssueReportDialog from './IssueReportDialog.svelte';

	const { Story } = defineMeta({
		title: 'Admin/Issue Report Dialog',
		component: IssueReportDialog,
		args: { onsubmit: fn(), oncancel: fn() }
	});
</script>

<Story
	name="With screenshot"
	args={{ preview_url: '/syntax-banner.png' }}
	play={async ({ args, canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		const file = canvas.getByRole('button', { name: 'File issue' });
		await expect(file).toBeDisabled();
		await userEvent.type(
			canvas.getByRole('textbox', { name: 'What needs to change?' }),
			'Make the logo bigger'
		);
		await userEvent.click(file);
		await expect(args.onsubmit).toHaveBeenCalledWith('Make the logo bigger');
	}}
/>

<Story name="Without screenshot" args={{ preview_url: null }} />

<Story
	name="Not filed"
	args={{
		preview_url: '/syntax-banner.png',
		request: 'Make the logo bigger',
		error_message: 'Not filed: GitHub didn’t open the issue: 401'
	}}
/>
