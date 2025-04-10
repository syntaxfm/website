<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItemSwag from './FeedItemSwag.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItemSwag',
		component: FeedItemSwag
	});
</script>

<Story name="Default" />
