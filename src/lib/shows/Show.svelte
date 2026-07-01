<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import Dot from '$lib/utilities/Dot.svelte';
	import { player } from '$state/player';
	import { get_id_from_url, get_thumbnail_from_id } from '$lib/videos/utils';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import get_show_path from '$utilities/slug';
	import no_thumb from './no_thumb.png';

	interface Props {
		show: {
			title: string;
			date: Date | string;
			show: string;
			thumbnail?: string | null;
			youtube_url?: string | null;
			url?: string | null;
			number: number;
			slug: string;
		};
		type: 'grid' | 'list';
		href?: string;
		onselect?: () => void;
		data_has_node?: boolean;
		preload_data?: boolean;
	}

	let { show, type, href, onselect, data_has_node = false, preload_data = false }: Props = $props();
	let youtube_video_id = $derived(show.youtube_url ? get_id_from_url(show.youtube_url) : '');
	let thumbnail_src = $derived(
		(youtube_video_id ? get_thumbnail_from_id(youtube_video_id) : '') || show.thumbnail || no_thumb
	);
	let show_href = $derived(href || get_show_path(show));
	let show_date = $derived(show.date instanceof Date ? show.date : new Date(show.date));
	let formatted_date = $derived(
		show_date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
	let can_play_show = $derived(Boolean(show.url));

	type PlayerShow = Parameters<typeof player.start_show>[0];

	function on_play_overlay_click(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!can_play_show) return;
		void player.start_show(show as PlayerShow);
	}
</script>

<a
	class="show-link"
	href={resolve(show_href as Pathname)}
	onclick={onselect}
	data-has-node={data_has_node ? true : undefined}
	data-sveltekit-preload-data={preload_data ? '' : undefined}
>
	<article
		class={[type === 'list' ? 'flex bg-shade-or-tint-light show-list-view' : 'show-grid-view']}
	>
		<div class={['thumbnail-wrap', type === 'list' ? 'br-small' : 'br-medium']}>
			<img
				style={type === 'list' ? 'width: 135px;' : 'width: 100%'}
				src={thumbnail_src}
				alt={show.title}
			/>
			{#if can_play_show}
				<button
					type="button"
					class="thumbnail-play-overlay"
					onclick={on_play_overlay_click}
					aria-label={`Play episode ${show.number}: ${show.title}`}
				>
					<span class="play-icon-wrap" aria-hidden="true">
						<Icon name="play" width={18} height={18} aria_hidden={true} />
					</span>
				</button>
			{/if}
		</div>
		<div class={['stack', type === 'grid' && 'stack-reverse']} style:--stack-gap="0.5rem">
			<h3 class="fs-body fv-700-i">{show.title}</h3>
			<div class="flex">
				{#if type === 'list'}
					<p class="fs-caption">
						{formatted_date}
					</p>
				{/if}
				<Dot color="var(--c-primary)" />
				<p class="fs-caption">{show.show}</p>
				<p class="fs-caption">{show.number}</p>
			</div>
		</div>
	</article>
</a>

<style>
	.show-list-view {
		border-radius: var(--br-medium);
		padding: 8px;
	}

	.show-link {
		color: inherit;
		display: block;
		text-decoration: none;
	}

	.show-grid-view {
		max-width: 300px;
	}

	.show-grid-view .thumbnail-wrap {
		margin-bottom: 0.5rem;
	}

	.thumbnail-wrap {
		position: relative;
		overflow: hidden;

		img {
			display: block;
		}
	}

	.thumbnail-play-overlay {
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

	.thumbnail-wrap:hover .thumbnail-play-overlay,
	.thumbnail-wrap:focus-within .thumbnail-play-overlay {
		opacity: 1;
		pointer-events: auto;
	}

	.play-icon-wrap {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background: color-mix(in lch, var(--c-black), transparent 30%);
		color: var(--c-white);
	}

	.thumbnail-play-overlay:focus-visible {
		opacity: 1;
		pointer-events: auto;
		outline: 2px solid var(--c-primary);
		outline-offset: -2px;
	}

	.flex {
		align-items: center;
	}
</style>
