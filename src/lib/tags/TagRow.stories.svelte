<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TagRow from './TagRow.svelte';

	const { Story } = defineMeta({
		title: 'Tags/TagRow',
		component: TagRow
	});
</script>

<Story name="Default" />
