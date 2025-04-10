<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StaffPick from './StaffPick.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/StaffPick',
		component: StaffPick
	});
</script>

<Story name="Default" />
