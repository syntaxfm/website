<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Toggle from './Toggle.svelte';

	const { Story } = defineMeta({
		title: 'Forms/Toggle',
		component: Toggle
	});
</script>

<Story
	name="Default"
	args={{
		label: 'Toggle',
		checked: false,
		on_icon: 'grid',
		off_icon: 'list'
	}}
/>
