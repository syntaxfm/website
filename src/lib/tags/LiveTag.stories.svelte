<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LiveTag from './LiveTag.svelte';

	const { Story } = defineMeta({
		title: 'Tags/LiveTag',
		component: LiveTag
	});
</script>

<Story name="Default" />
