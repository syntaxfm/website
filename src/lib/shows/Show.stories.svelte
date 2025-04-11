<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Show from './Show.svelte';

	const { Story } = defineMeta({
		title: 'Shows/Show',
		component: Show
	});
</script>

<Story
	name="Grid View"
	args={{
		type: 'grid',
		show: {
			title: '$300M for a domain? Web Devs React',
			show: 'Syntax Podcast',
			thumbnail:
				'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
			date: new Date('2021-01-01')
		}
	}}
/>
<Story
	name="List View"
	args={{
		type: 'list',
		show: {
			title: '$300M for a domain? Web Devs React',
			show: 'Syntax Podcast',
			thumbnail:
				'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
			date: new Date('2021-01-01')
		}
	}}
/>
