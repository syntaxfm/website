<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import UpcomingEvents from './UpcomingEvents.svelte';

	const { Story } = defineMeta({
		title: 'Events/UpcomingEvents',
		component: UpcomingEvents
	});
</script>

<Story name="Default" />
