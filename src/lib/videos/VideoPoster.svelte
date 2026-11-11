<script lang="ts">
	import Icon from '#lib/Icon.svelte';
	import { get_thumbnail_from_id, get_thumbnail_srcset_from_id } from './utils';

	interface Props {
		video_id: string;
		// Names the button, e.g. "Play episode 1052"
		label: string;
		// How wide the picture renders, so the browser picks the smallest sharp file
		sizes: string;
		onplay: () => void;
		// The visitor is about to play (pointer over it, or focused)
		onwarm?: () => void;
		// The video is playing in the player bar: the button brings it back here
		is_docked?: boolean;
	}

	let { video_id, label, sizes, onplay, onwarm, is_docked = false }: Props = $props();
</script>

<!--
	A YouTube video's picture with a play button over it. YouTube's own player is 17 requests and
	1.1 MB, so pages show this until the visitor goes to play. Fills its parent, which needs
	`position: relative`.

	The picture is usually the page's largest, so it loads first. The button names it.
-->
<img
	src={get_thumbnail_from_id(video_id)}
	srcset={get_thumbnail_srcset_from_id(video_id)}
	{sizes}
	width="1280"
	height="720"
	alt=""
	fetchpriority="high"
	decoding="async"
/>
<button
	type="button"
	onclick={onplay}
	onpointerenter={onwarm}
	onfocus={onwarm}
	aria-label={label}
	title={label}
>
	{#if is_docked}
		<span class="restore"><Icon name="expand" /></span>
	{:else}
		<span class="play"><Icon name="play" width={32} height={32} aria_hidden={true} /></span>
	{/if}
</button>

<style>
	img {
		display: block;
		width: 100%;
		height: 100%;

		/* YouTube's 640px picture is 4:3 with the frame letterboxed inside it */
		object-fit: cover;
	}

	button {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
	}

	span {
		display: grid;
		place-items: center;
		background: color-mix(in lch, var(--c-black), transparent 30%);
		color: var(--c-white);
	}

	.play {
		width: 5rem;
		height: 5rem;
		border-radius: 9999px;
		transition: scale 0.15s ease-out;
	}

	button:is(:hover, :focus-visible) .play {
		scale: 1.08;
	}

	.restore {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 8px;
		border-radius: var(--br-medium);
	}

	@media (prefers-reduced-motion: reduce) {
		.play {
			transition: none;
		}
	}
</style>
