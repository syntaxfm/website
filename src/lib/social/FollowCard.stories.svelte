<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FollowCard from './FollowCard.svelte';

	const { Story } = defineMeta({
		title: 'Social/FollowCard',
		component: FollowCard
	});
</script>

<Story name="Default" />
