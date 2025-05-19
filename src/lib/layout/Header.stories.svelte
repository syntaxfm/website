<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Header from './Header.svelte';

	const { Story } = defineMeta({
		title: 'Layout/Header',
		component: Header
	});
</script>

<Story name="Interior" />
<Story name="Landing" args={{ page_type: 'landing' }} />
