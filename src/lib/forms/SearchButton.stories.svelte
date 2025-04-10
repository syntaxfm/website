<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchButton from './SearchButton.svelte';

	const { Story } = defineMeta({
		title: 'Forms/SearchButton',
		component: SearchButton
	});
</script>

<Story name="Default" />
