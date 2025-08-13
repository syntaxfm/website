<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Player from './Player.svelte';

	const { Story } = defineMeta({
		title: 'Media/Player',
		component: Player
	});
</script>

<Story name="Default" />
