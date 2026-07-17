<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LiveStream from './LiveStream.svelte';

	const sample_stream = {
		id: 'pMwTR2KeuaU',
		title: 'Bun re-written in Rust, Zig team big mad',
		url: 'https://www.youtube.com/watch?v=pMwTR2KeuaU',
		embed_url:
			'https://www.youtube-nocookie.com/embed/pMwTR2KeuaU?autoplay=1&mute=1&playsinline=1&rel=0&controls=1',
		started_at: '2026-07-14T15:00:00.000Z',
		labels: ['ai', 'github', 'conference']
	};
	const long_label_stream = {
		...sample_stream,
		labels: ['artificial-intelligence', 'github-universe-keynote', 'developer-conference']
	};

	const { Story } = defineMeta({
		title: 'Media/LiveStream',
		component: LiveStream
	});
</script>

<Story name="Live" args={{ stream: sample_stream }} />
<Story name="Long labels" args={{ stream: long_label_stream }} />
<Story name="Debug" args={{ stream: null, debug: true }} />
