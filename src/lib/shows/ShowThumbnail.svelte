<script lang="ts">
	import Icon from '#lib/Icon.svelte';
	import { player } from '$state/player';
	import {
		get_id_from_url,
		get_thumbnail_from_id,
		get_thumbnail_srcset_from_id
	} from '#lib/videos/utils.ts';
	import { youtube_slot } from '#lib/videos/video_actions.ts';
	import no_thumb from './no_thumb.png';

	interface Props {
		show: {
			title: string;
			number: number;
			slug: string;
			url?: string | null;
			youtube_url?: string | null;
			thumbnail?: string | null;
		};
		// Big enough for the video to play right here. Otherwise it plays docked in the player bar.
		is_video_slot?: boolean;
		class?: string;
		width?: string;
		// How wide the thumbnail renders, so the browser picks the smallest sharp srcset file
		sizes: string;
		// Only thumbnails on the first screen should load eagerly
		loading?: 'lazy' | 'eager';
	}

	let {
		show,
		is_video_slot = false,
		class: class_name,
		width = '100%',
		sizes,
		loading = 'lazy'
	}: Props = $props();

	let youtube_video_id = $derived(get_id_from_url(show.youtube_url));
	let thumbnail_src = $derived(
		(youtube_video_id ? get_thumbnail_from_id(youtube_video_id) : '') || show.thumbnail || no_thumb
	);
	let thumbnail_srcset = $derived(
		youtube_video_id ? get_thumbnail_srcset_from_id(youtube_video_id) : undefined
	);

	function play(event: MouseEvent) {
		// The thumbnail can sit inside a link to the show
		event.preventDefault();
		event.stopPropagation();
		const { number, title, slug, url, youtube_url } = show;
		if (!url) return;
		void player.start_show({ number, title, slug, url, youtube_url });
	}
</script>

<div
	class={['thumbnail', class_name]}
	{@attach is_video_slot && youtube_video_id ? youtube_slot(show.number) : undefined}
>
	<img
		style:width
		src={thumbnail_src}
		srcset={thumbnail_srcset}
		{sizes}
		{loading}
		fetchpriority={loading === 'eager' ? 'high' : undefined}
		decoding="async"
		width="1280"
		height="720"
		alt={show.title}
	/>
	{#if show.url}
		<button type="button" onclick={play} aria-label={`Play episode ${show.number}: ${show.title}`}>
			<span aria-hidden="true">
				<Icon name="play" width={18} height={18} aria_hidden={true} />
			</span>
		</button>
	{/if}
</div>

<style>
	.thumbnail {
		position: relative;
		overflow: hidden;

		img {
			display: block;
			height: auto;
			aspect-ratio: 16 / 9;
			object-fit: cover;
		}
	}

	button {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		opacity: 0;
		pointer-events: none;
		background: color-mix(in lch, var(--c-black), transparent 55%);
		border: 0;
		transition: opacity 0.2s ease;
	}

	button:focus-visible {
		opacity: 1;
		pointer-events: auto;
		outline: 2px solid var(--c-primary);
		outline-offset: -2px;
	}

	.thumbnail:hover button,
	.thumbnail:focus-within button {
		opacity: 1;
		pointer-events: auto;
	}

	span {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background: color-mix(in lch, var(--c-black), transparent 30%);
		color: var(--c-white);
	}
</style>
