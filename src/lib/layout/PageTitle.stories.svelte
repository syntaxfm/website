<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PageTitle from './PageTitle.svelte';

	const { Story } = defineMeta({
		title: 'Layout/PageTitle',
		component: PageTitle
	});
</script>

<Story name="Default" />
