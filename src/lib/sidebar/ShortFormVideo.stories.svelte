<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShortFormVideo from './ShortFormVideo.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/ShortFormVideo',
		component: ShortFormVideo
	});
</script>

<Story name="Default" />
