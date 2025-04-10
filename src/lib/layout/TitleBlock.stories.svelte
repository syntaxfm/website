<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TitleBlock from './TitleBlock.svelte';

	const { Story } = defineMeta({
		title: 'Layout/TitleBlock',
		component: TitleBlock
	});
</script>

<Story name="Default" />
