<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Event from './Event.svelte';

	const { Story } = defineMeta({
		title: 'Events/Event',
		component: Event
	});
</script>

<Story name="Default" />
