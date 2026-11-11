<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import HomeHero from './HomeHero.svelte';

	const live_video = {
		id: 'pMwTR2KeuaU',
		title: 'Bun re-written in Rust, Zig team big mad',
		is_live: true
	};
	const latest_video = { ...live_video, is_live: false };
	const episode = {
		number: 1052,
		title: 'Github Universe Keynote Recap',
		slug: 'github-universe-keynote-recap',
		url: 'https://traffic.megaphone.fm/FSI4626542802.mp3',
		youtube_url: 'https://www.youtube.com/watch?v=XPnpzSA8RlI'
	};

	const { Story } = defineMeta({
		title: 'Media/HomeHero',
		component: HomeHero
	});
</script>

<Story name="Live" args={{ video: live_video }} />
<Story name="Latest video" args={{ video: latest_video }} />
<Story name="Short title" args={{ video: { ...latest_video, title: 'CSS is back' } }} />
<Story
	name="Long title"
	args={{
		video: {
			...latest_video,
			title:
				'Bun re-written in Rust, Zig team big mad ✧ TypeScript 7 released, now 10x faster ✧ Potluck questions'
		}
	}}
/>
<Story
	name="Latest episode"
	args={{ video: { ...latest_video, id: 'XPnpzSA8RlI', title: episode.title }, show: episode }}
/>
<Story name="Debug" args={{ video: null, debug: true }} />
