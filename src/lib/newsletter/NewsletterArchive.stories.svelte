<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NewsletterArchive from './NewsletterArchive.svelte';

	const { Story } = defineMeta({
		title: 'Newsletter/NewsletterArchiveTitle',
		component: NewsletterArchive
	});
</script>

<Story
	name="Default"
	args={{
		id: 1,
		issue_number: 35,
		title: "Svelte 5 overview, the world's most valuable startup, how to pic a mic",
		date: '2024-12-18'
	}}
/>

<Story
	name="Alt Details"
	args={{
		id: 100,
		issue_number: 100,
		title: 'Svelte 5 overview',
		date: '2025-05-12'
	}}
/>
