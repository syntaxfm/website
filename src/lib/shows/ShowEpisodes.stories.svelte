<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ShowEpisodes from './ShowEpisodes.svelte';

	const { Story } = defineMeta({
		title: 'Shows/ShowEpisodes',
		component: ShowEpisodes
	});
</script>

<Story
	name="Grid"
	args={{
		type: 'grid',
		shows: [
			{
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01')
			},
			{
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01')
			}
		]
	}}
/>

<Story
	name="List"
	args={{
		type: 'list',
		shows: [
			{
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01')
			},
			{
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01')
			}
		]
	}}
/>
