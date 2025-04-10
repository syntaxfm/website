<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ContentBanner from './ContentBanner.svelte';

	const { Story } = defineMeta({
		title: 'Layout/ContentBanner',
		component: ContentBanner
	});
</script>

<Story name="Default" />
