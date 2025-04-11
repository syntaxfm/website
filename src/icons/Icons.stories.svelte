<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Icons from './Icons.svelte';

	const { Story } = defineMeta({
		title: 'Icons/Icons',
		component: Icons
	});
</script>

<Story name="Default" />
