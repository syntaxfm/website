<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItem from './FeedItem.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItem',
		component: FeedItem
	});
</script>

<Story name="Default" />
