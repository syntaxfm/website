<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShortFormVideos from './ShortFormVideos.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/ShortFormVideos',
		component: ShortFormVideos
	});
</script>

<Story name="Default" />
