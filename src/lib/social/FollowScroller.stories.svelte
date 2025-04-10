<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FollowScroller from './FollowScroller.svelte';

	const { Story } = defineMeta({
		title: 'Social/FollowScroller',
		component: FollowScroller
	});
</script>

<Story name="Default" />
