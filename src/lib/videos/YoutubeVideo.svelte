<script lang="ts">
	import { untrack } from 'svelte';
	import type { YoutubeVideoElementLike } from '#state/youtube_player.js';

	interface Props {
		video_id: string;
		// Where a switched-to video starts, only read when video_id changes
		start_seconds?: number;
		element?: YoutubeVideoElementLike | null;
		onplay?: () => void;
		onplaying?: () => void;
		onpause?: () => void;
		onended?: () => void;
		onerror?: () => void;
		ondurationchange?: () => void;
	}

	let {
		video_id,
		start_seconds = 0,
		element = $bindable(null),
		onplay,
		onplaying,
		onpause,
		onended,
		onerror,
		ondurationchange
	}: Props = $props();

	// Set once. youtube-video-element rebuilds the iframe whenever src changes,
	// so later videos are loaded into the same player with loadVideoById instead.
	const src = untrack(() => `https://www.youtube.com/watch?v=${video_id}`);
	let loaded_id = untrack(() => video_id);

	// Leaving out the controls attribute sends controls=0. The player bar's controls drive it instead.
	const PLAYER_VARS = { fs: 0, disablekb: 1 };

	$effect(() => {
		const id = video_id;
		const el = element;
		if (!el || id === loaded_id) return;
		const start = untrack(() => start_seconds);
		// Another video picked while waiting cancels this one
		let is_cancelled = false;
		void Promise.resolve(el.loadComplete).then(() => {
			if (is_cancelled) return;
			if (el.api) {
				el.api.loadVideoById({ videoId: id, startSeconds: start });
			} else {
				// No API to switch in place, rebuilding the iframe at least shows the right video
				el.src = `https://www.youtube.com/watch?v=${id}`;
			}
			// Only once it's actually loading, so the store and the iframe never disagree
			loaded_id = id;
		});
		return () => {
			is_cancelled = true;
		};
	});
</script>

<youtube-video
	bind:this={element}
	playsinline
	config={PLAYER_VARS}
	{src}
	{onplay}
	{onplaying}
	{onpause}
	{onended}
	{onerror}
	{ondurationchange}
></youtube-video>

<style>
	youtube-video {
		display: block;
		width: 100%;
		height: 100%;
		/* Overrides the element's own 300x150 minimum so it fits the dock */
		min-width: 0;
		min-height: 0;
	}
</style>
