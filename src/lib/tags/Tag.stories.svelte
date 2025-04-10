<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Tag from './Tag.svelte';

	const { Story } = defineMeta({
		title: 'Tags/Tag',
		component: Tag
	});
</script>

<Story name="Default" />
