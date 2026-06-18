<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RankedSidebarItem from './RankedItem.svelte';

	const { Story } = defineMeta({
		title: 'Sidebar/RankedSidebarItem',
		component: RankedSidebarItem
	});
</script>

<Story
	name="Default"
	args={{
		rank: 1,
		item: {
			id: '1',
			title: '$300M for a domain? Web Devs React',
			href: '/show/100/300m-for-a-domain',
			series: 'Syntax Podcast',
			number: 100,
			thumbnail:
				'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
			date: new Date('2021-01-01'),
			people: ['Dan Abramov', 'Wes Bos', 'Scott Tolinski']
		}
	}}
/>
