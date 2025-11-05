<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItemPodcast from './FeedItemPodcast.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItemPodcast',
		component: FeedItemPodcast
	});
</script>

<Story name="Default" />
