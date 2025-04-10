<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShowListItem from './ShowListItem.svelte';

	const { Story } = defineMeta({
		title: 'Shows/ShowListItem',
		component: ShowListItem
	});
</script>

<Story name="Default" />
