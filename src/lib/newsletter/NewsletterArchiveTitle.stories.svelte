<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NewsletterArchiveTitle from './NewsletterArchiveTitle.svelte';

	const { Story } = defineMeta({
		title: 'Newsletter/NewsletterArchiveTitle',
		component: NewsletterArchiveTitle
	});
</script>

<Story name="Default" />
