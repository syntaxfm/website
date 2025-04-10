<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Graphics from './Graphics.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Graphics',
		component: Graphics
	});
</script>

<Story name="Default" />
