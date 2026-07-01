<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TagRow from './TagRow.svelte';

	const { Story } = defineMeta({
		title: 'Tags/TagRow',
		component: TagRow
	});
</script>

<Story
	name="Default"
	args={{
		tags: [
			{ name: 'tag1', slug: 'tag1' },
			{ name: 'tag2', slug: 'tag2' },
			{ name: 'tag3', slug: 'tag3' }
		]
	}}
/>
<Story
	name="Lots of tags"
	args={{
		tags: Array.from({ length: 10 }, (_, index) => ({
			name: `tag${index + 1}`,
			slug: `tag${index + 1}`
		}))
	}}
/>
