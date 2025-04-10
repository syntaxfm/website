<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TrendingTopics from './TrendingTopics.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/TrendingTopics',
		component: TrendingTopics
	});
</script>

<Story name="Default" />
