<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProducedBySentry from '$lib/layout/ProducedBySentry.svelte';

	const { Story } = defineMeta({
		title: 'Layout/ProducedBySentry',
		component: ProducedBySentry
	});
</script>

<Story name="Default" />
