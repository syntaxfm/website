<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NewsletterPromo from './NewsletterPromo.svelte';

	const { Story } = defineMeta({
		title: 'Newsletter/NewsletterPromo',
		component: NewsletterPromo
	});
</script>

<Story name="Default" />
