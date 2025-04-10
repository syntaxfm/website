<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Nav from './Nav.svelte';

	const { Story } = defineMeta({
		title: 'Layout/Nav',
		component: Nav
	});
</script>

<Story name="Default" />
