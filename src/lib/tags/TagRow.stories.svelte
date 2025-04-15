<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TagRow from './TagRow.svelte';

	const { Story } = defineMeta({
		title: 'Tags/TagRow',
		component: TagRow
	});
</script>

<Story name="Default" args={{ tags: ['tag1', 'tag2', 'tag3'] }} />
<Story
	name="Lots of tags"
	args={{ tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10'] }}
/>
