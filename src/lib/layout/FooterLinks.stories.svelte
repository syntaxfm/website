<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FooterLinks from './FooterLinks.svelte';

	const { Story } = defineMeta({
		title: 'Layout/FooterLinks',
		component: FooterLinks
	});
</script>

<Story name="Default" />
