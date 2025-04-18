<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RankedItems from './RankedItems.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/RankedItems',
		component: RankedItems
	});
</script>

<Story
	name="Default"
	args={{
		shows: [
			{
				id: '1',
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				number: 309,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01'),
				hosts: [{ name: 'Wes Bos', github: 'wesbos', twitter: 'wesbos' }],
				guests: [{ name: 'Dan Abramov', github: 'dan_abramov', twitter: 'dan_abramov' }]
			},
			{
				id: '2',
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				number: 370,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01'),
				hosts: [{ name: 'Wes Bos', github: 'wesbos', twitter: 'wesbos' }],
				guests: [{ name: 'Dan Abramov', github: 'dan_abramov', twitter: 'dan_abramov' }]
			},
			{
				id: '3',
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				number: 100,
				date: new Date('2021-01-01'),
				hosts: [{ name: 'Wes Bos', github: 'wesbos', twitter: 'wesbos' }],
				guests: [{ name: 'Dan Abramov', github: 'dan_abramov', twitter: 'dan_abramov' }]
			},
			{
				id: '4',
				title: '$300M for a domain? Web Devs React',
				show: 'Syntax Podcast',
				number: 500,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2021-01-01'),
				hosts: [{ name: 'Wes Bos', github: 'wesbos', twitter: 'wesbos' }],
				guests: [{ name: 'Dan Abramov', github: 'dan_abramov', twitter: 'dan_abramov' }]
			}
		]
	}}
/>
