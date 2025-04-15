<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FeedItem from './FeedItem.svelte';

	const { Story } = defineMeta({
		title: 'Feed/FeedItem',
		component: FeedItem
	});

	const show = $state({
		name: 'The Joe Show',
		title: 'The Joe Show',
		thumbnail:
			'https://i.ytimg.com/vi/AIlgkt7oPMA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCkovHTvZUZi6tf8TUmeRfPX_wr8Q',
		number: 400
	});
</script>

<Story name="Default" args={{ show }} />
