<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PrevNext from './PrevNext.svelte';

	const { Story } = defineMeta({
		title: 'Shows/PrevNext',
		component: PrevNext
	});
</script>

<Story
	name="Default"
	args={{
		next_show: {
			number: 818,
			title: 'CJ × Hosting Meetups - Lunch and Learn',
			slug: 'cj-hosting-meetups-lunch-and-learn'
		},
		prev_show: {
			number: 816,
			title: 'Why Your CSS Sucks',
			slug: 'why-your-css-sucks'
		}
	}}
/>
