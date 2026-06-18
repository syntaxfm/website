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
		items: [
			{
				id: '1',
				title: 'The Future of VS Code and Copilot',
				href: '/show/846/the-future-of-vs-code-and-copilot',
				series: 'Syntax Podcast',
				number: 846,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2024-11-04'),
				people: ['Cassidy Williams', 'Scott Tolinski', 'Wes Bos']
			},
			{
				id: '2',
				title: 'How to Pick a JS Package',
				href: '/show/845/how-to-pick-a-js-package',
				series: 'Syntax Podcast',
				number: 845,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2024-11-01'),
				people: ['Scott Tolinski', 'Wes Bos']
			},
			{
				id: '3',
				title: "Web Components don't Save Us with Joel",
				href: '/show/844/web-components',
				series: 'Syntax Podcast',
				number: 844,
				thumbnail:
					'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
				date: new Date('2024-10-28'),
				people: ['CJ Reynolds', 'Scott Tolinski', 'Wes Bos']
			}
		]
	}}
/>
