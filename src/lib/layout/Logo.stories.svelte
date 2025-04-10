<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Logo from './Logo.svelte';

	const { Story } = defineMeta({
		title: 'Layout/Logo',
		component: Logo
	});
</script>

<Story name="Default" />
