<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NewsletterBanner from './NewsletterBanner.svelte';

	const { Story } = defineMeta({
		title: 'Newsletter/NewsletterBanner',
		component: NewsletterBanner
	});
</script>

<Story name="Default" />
