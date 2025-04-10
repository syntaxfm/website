<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Feed from './Feed.svelte';

	const { Story } = defineMeta({
		title: 'Feed/Feed',
		component: Feed
	});
</script>

<Story name="Default" />
