<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NewsletterArchiveTitle from './NewsletterArchiveTitle.svelte';

	const { Story } = defineMeta({
		title: 'Newsletter/NewsletterArchiveTitle',
		component: NewsletterArchiveTitle
	});
</script>

<Story
	name="Default"
	args={{
		title: "Svelte 5 overview, the world's most valuable startup, how to pic a mic",
		date: 'April 11, 2025',
		issue: 1
	}}
/>

<Story
	name="Alt Details"
	args={{
		title: 'Svelte 5 overview',
		date: 'May 12, 2025',
		issue: 100
	}}
/>
