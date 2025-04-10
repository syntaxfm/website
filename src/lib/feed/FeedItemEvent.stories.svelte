<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItemEvent from './FeedItemEvent.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItemEvent',
		component: FeedItemEvent
	});
</script>

<Story name="Default" />
