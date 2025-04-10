<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ListViewItem from './ListViewItem.svelte';

	const { Story } = defineMeta({
		title: 'Articles/ListViewItem',
		component: ListViewItem
	});
</script>

<Story name="Default" />
