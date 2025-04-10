<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItemShow from './FeedItemShow.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItemShow',
		component: FeedItemShow
	});
</script>

<Story name="Default" />
