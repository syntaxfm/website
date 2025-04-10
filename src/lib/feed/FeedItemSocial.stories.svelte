<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItemSocial from './FeedItemSocial.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItemSocial',
		component: FeedItemSocial
	});
</script>

<Story name="Default" />
