<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ListViewShow from './ListViewShow.svelte';

	const { Story } = defineMeta({
		title: 'Shows/ListViewShow',
		component: ListViewShow
	});
</script>

<Story
	name="Default"
	args={{
		show: {
			title: '$300M for a domain? Web Devs React',
			date: new Date('2025-04-12'),
			show: 'Syntax Podcast',
			thumbnail:
				'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q'
		}
	}}
/>
