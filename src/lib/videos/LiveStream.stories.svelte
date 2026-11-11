<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LiveStream from './LiveStream.svelte';

	const live_video = {
		id: 'pMwTR2KeuaU',
		title: 'Bun re-written in Rust, Zig team big mad',
		url: 'https://www.youtube.com/watch?v=pMwTR2KeuaU',
		is_live: true,
		started_at: '2026-07-14T15:00:00.000Z',
		labels: ['ai', 'github', 'conference']
	};
	const long_label_video = {
		...live_video,
		labels: ['artificial-intelligence', 'github-universe-keynote', 'developer-conference']
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
		title: 'Media/LiveStream',
		component: LiveStream
	});
</script>

<Story name="Live" args={{ video: live_video }} />
<Story name="Long labels" args={{ video: long_label_video }} />
<Story name="Latest video" args={{ video: latest_video }} />
<Story
	name="Latest episode"
	args={{ video: { ...latest_video, id: 'XPnpzSA8RlI', title: episode.title }, show: episode }}
/>
<Story name="Debug" args={{ video: null, debug: true }} />
