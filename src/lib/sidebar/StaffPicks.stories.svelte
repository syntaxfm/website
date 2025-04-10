<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StaffPicks from './StaffPicks.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/StaffPicks',
		component: StaffPicks
	});
</script>

<Story name="Default" />
