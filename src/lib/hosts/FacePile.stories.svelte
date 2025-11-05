<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FacePile from './FacePile.svelte';

	const { Story } = defineMeta({
		title: 'Hosts/FacePile',
		component: FacePile
	});
</script>

<Story name="Default" />
